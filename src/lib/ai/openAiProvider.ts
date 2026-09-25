import {
  AiProviderError,
  type AiAssistRequest,
  type AiAssistResult,
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
    'Respond ONLY with JSON: {"items": string[]}. No markdown, no preamble.',
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

    return { heading: headings[request.capability], items: items.slice(0, 4) }
  }
}

/** Accepts raw JSON, fenced JSON, or a plain numbered list as a fallback. */
export function parseItems(content: string): string[] {
  const trimmed = content.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()

  try {
    const parsed: unknown = JSON.parse(trimmed)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      Array.isArray((parsed as { items?: unknown }).items)
    ) {
      return ((parsed as { items: unknown[] }).items)
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
    }
  } catch {
    // fall through to line parsing
  }

  return trimmed
    .split('\n')
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
    .filter(Boolean)
}
