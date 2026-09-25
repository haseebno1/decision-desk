import {
  AI_SUGGESTED_WEIGHT,
  AiProviderError,
  type AiAssistRequest,
  type AiAssistResult,
  type AiCriterionSuggestion,
  type AiProvider,
} from './types'

const CAPABILITY_PROMPTS: Record<AiAssistRequest['capability'], string> = {
  'clarifying-questions':
    'List up to 4 short clarifying questions the user should answer before deciding.',
  'criteria-suggestions':
    'Suggest up to 4 decision criteria the user may have missed, each with a brief reason.',
  summary:
    'Summarize where this decision stands in up to 4 short observations.',
}

function systemPrompt(capability: AiAssistRequest['capability']): string {
  return [
    'You are a concise decision-making assistant inside the Decision Desk app.',
    CAPABILITY_PROMPTS[capability],
    capability === 'criteria-suggestions'
      ? 'Respond ONLY with JSON: {"items": string[], "criteria": [{"label": string, "weight": number}]}. ' +
        'Weights are 1 (barely matters) to 5 (decides it). Every criterion must also appear in items.'
      : 'Respond ONLY with JSON: {"items": string[]}.',
    'No markdown, no preamble.',
  ].join(' ')
}

function userPrompt({ context }: AiAssistRequest): string {
  const criteria = context.criterionLabels
    .map((c) => `${c.label} (weight ${c.weight}/5)`)
    .join('; ')
  return [
    `Decision title: ${context.title}`,
    context.description ? `Description: ${context.description}` : null,
    `Category: ${context.category} · Stake: ${context.stake}`,
    `Options: ${context.optionLabels.join(', ') || 'none yet'}`,
    `Criteria so far: ${criteria || 'none yet'}`,
  ]
    .filter(Boolean)
    .join('\n')
}

interface ChatResponseShape {
  choices?: Array<{ message?: { content?: string } }>
}

/**
 * Works against any OpenAI-compatible chat-completions endpoint
 * (OpenAI, OpenRouter, local LLM gateways, ...). Only constructed when
 * the user has explicitly configured a base URL + key in AI settings.
 */
export class OpenAiCompatibleProvider implements AiProvider {
  readonly id = 'openai-compatible'
  readonly label = 'OpenAI-compatible API'
  readonly requiresSetup = true

  private readonly baseUrl: string
  private readonly apiKey: string
  private readonly model: string

  constructor(baseUrl: string, apiKey: string, model: string) {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
    this.model = model
  }

  isConfigured(): boolean {
    return this.baseUrl.trim() !== '' && this.apiKey.trim() !== ''
  }

  async assist(request: AiAssistRequest): Promise<AiAssistResult> {
    if (!this.isConfigured()) {
      throw new AiProviderError(
        'API base URL and key are required.',
        this.id,
      )
    }

    const headings: Record<AiAssistRequest['capability'], string> = {
      'clarifying-questions': 'Questions worth answering first',
      'criteria-suggestions': 'Criteria you may be missing',
      summary: 'Where this decision stands',
    }

    let response: Response
    try {
      response = await fetch(
        `${this.baseUrl.replace(/\/+$/, '')}/chat/completions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: this.model,
            messages: [
              { role: 'system', content: systemPrompt(request.capability) },
              { role: 'user', content: userPrompt(request) },
            ],
            temperature: 0.4,
            max_tokens: 300,
          }),
          signal: AbortSignal.timeout(20_000),
        },
      )
    } catch (error) {
      throw new AiProviderError(
        error instanceof Error && error.name === 'TimeoutError'
          ? 'Request timed out.'
          : 'Could not reach the AI endpoint.',
        this.id,
      )
    }

    if (!response.ok) {
      throw new AiProviderError(
        `AI request failed (${response.status}).`,
        this.id,
      )
    }

    let payload: ChatResponseShape
    try {
      payload = (await response.json()) as ChatResponseShape
    } catch {
      throw new AiProviderError('AI returned malformed JSON.', this.id)
    }

    const content = payload.choices?.[0]?.message?.content ?? ''
    const items = parseItems(content)

    if (items.length === 0) {
      throw new AiProviderError('AI returned no usable content.', this.id)
    }

    const suggestedCriteria = parseCriteria(content)

    return {
      heading: headings[request.capability],
      items: items.slice(0, 4),
      // Only meaningful for criteria suggestions; other capabilities return [].
      ...(suggestedCriteria.length > 0 ? { suggestedCriteria } : {}),
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** Strips an optional markdown fence from a model response. */
function unfence(content: string): string {
  return content.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
}

function tryParseJson(content: string): unknown {
  try {
    return JSON.parse(unfence(content))
  } catch {
    return undefined
  }
}

/** Clamps a model-proposed weight into the app's 1–5 range. */
function clampWeight(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) return AI_SUGGESTED_WEIGHT
  return Math.min(5, Math.max(1, Math.round(numeric)))
}

/** Accepts raw JSON, fenced JSON, or a plain numbered list as a fallback. */
export function parseItems(content: string): string[] {
  const parsed = tryParseJson(content)
  if (isRecord(parsed) && Array.isArray(parsed.items)) {
    return parsed.items
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return unfence(content)
    .split('\n')
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
    .filter(Boolean)
}

/**
 * Structured criteria from a `criteria-suggestions` response, so the panel can
 * offer to add them. Deliberately forgiving: models drift, and a reply that is
 * only prose must degrade to "nothing to apply" rather than an error. Accepts
 * either a `{criteria: [...]}` array of objects/strings or a bare array.
 */
export function parseCriteria(content: string): AiCriterionSuggestion[] {
  const parsed = tryParseJson(content)
  const raw = Array.isArray(parsed)
    ? parsed
    : isRecord(parsed) && Array.isArray(parsed.criteria)
      ? parsed.criteria
      : null
  if (!raw) return []

  const seen = new Set<string>()
  const suggestions: AiCriterionSuggestion[] = []
  for (const entry of raw) {
    const label =
      typeof entry === 'string'
        ? entry
        : isRecord(entry)
          ? typeof entry.label === 'string'
            ? entry.label
            : typeof entry.name === 'string'
              ? entry.name
              : ''
          : ''
    const trimmed = label.trim()
    const key = trimmed.toLowerCase()
    if (trimmed === '' || seen.has(key)) continue
    seen.add(key)
    suggestions.push({
      label: trimmed,
      weight: isRecord(entry) ? clampWeight(entry.weight) : AI_SUGGESTED_WEIGHT,
    })
  }

  return suggestions.slice(0, 6)
}
