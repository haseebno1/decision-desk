import {
  AiProviderError,
  type AiAssistRequest,
  type AiAssistResult,
  type AiDecisionContext,
  type AiProvider,
} from './types'

/** Simulated network latency so UI states are exercised realistically. */
const LATENCY_MS = 450

/**
 * Offline, deterministic stand-in for a real provider. Heuristics over the
 * decision's category/options/criteria produce plausible suggestions —
 * good enough to design the UX against and to use without an API key.
 */
export class MockAiProvider implements AiProvider {
  readonly id = 'mock'
  readonly label = 'Mock (offline)'
  readonly requiresSetup = false

  isConfigured(): boolean {
    return true
  }

  async assist(request: AiAssistRequest): Promise<AiAssistResult> {
    await delay(LATENCY_MS)
    const { capability, context } = request
    try {
      switch (capability) {
        case 'clarifying-questions':
          return questionsFor(context)
        case 'criteria-suggestions':
          return criteriaFor(context)
        case 'summary':
          return summaryFor(context)
      }
    } catch (error) {
      throw new AiProviderError(
        error instanceof Error ? error.message : 'Mock provider failed',
        this.id,
      )
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const CATEGORY_QUESTIONS: Record<string, string[]> = {
  career: [
    'How does this choice affect where you want to be in two years?',
    'Is this reversible if it turns out badly?',
  ],
  purchase: [
    'What budget are you actually comfortable with, not just willing to stretch to?',
    'Is there a cheaper option you would be equally happy with?',
  ],
  lifestyle: [
    'Who else is affected by this decision?',
    'What would you tell a friend in exactly this situation?',
  ],
  relationships: [
    'What outcome would feel fair to everyone involved?',
    'What are you hoping the other person thinks or feels?',
  ],
  finance: [
    'What is the worst-case downside if this goes badly?',
    'Does this affect your emergency fund or fixed commitments?',
  ],
  other: [
    'What would make you regret this choice a year from now?',
    'Are you deciding now because it is the right time, or because of pressure?',
  ],
}

function questionsFor(context: AiDecisionContext): AiAssistResult {
  const items = [
    ...(CATEGORY_QUESTIONS[context.category] ?? CATEGORY_QUESTIONS.other),
  ]

  if (context.optionLabels.length < 3) {
    items.push('Is there a third option you have ruled out too quickly?')
  }
  if (context.description && context.description.trim().length > 0) {
    items.push('What does the description leave out that a stranger would ask about?')
  }
  if (context.criterionLabels.length === 0) {
    items.push('What are the top three things you care about in this choice?')
  }

  return { heading: 'Questions worth answering first', items: dedupe(items).slice(0, 4) }
}

const CATEGORY_CRITERIA: Record<string, string[]> = {
  career: ['Growth', 'Compensation', 'Work-life balance', 'Learning'],
  purchase: ['Cost', 'Quality', 'Longevity', 'Resale value'],
  lifestyle: ['Cost', 'Wellbeing', 'Time', 'Relationships'],
  relationships: ['Trust', 'Communication', 'Long-term happiness'],
  finance: ['Risk', 'Return', 'Liquidity', 'Time horizon'],
  other: ['Impact', 'Effort', 'Reversibility'],
}

function criteriaFor(context: AiDecisionContext): AiAssistResult {
  const existing = new Set(
    context.criterionLabels.map((c) => c.label.trim().toLowerCase()),
  )
  const base = CATEGORY_CRITERIA[context.category] ?? CATEGORY_CRITERIA.other

  const items = base
    .filter((label) => !existing.has(label.toLowerCase()))
    .map((label) => `${label} — common for ${categoryName(context.category)} decisions`)

  if (items.length === 0) {
    items.push(
      'Your criteria already cover the usual suspects — consider weighting them instead.',
    )
  }
  if (context.optionLabels.length >= 3) {
    items.push('With 3+ options, rank criteria before scoring to stay consistent.')
  }

  return { heading: 'Criteria you may be missing', items: dedupe(items).slice(0, 4) }
}

function summaryFor(context: AiDecisionContext): AiAssistResult {
  const options = context.optionLabels.length
  const criteria = context.criterionLabels.length
  const stake = context.stake
  const items: string[] = []

  items.push(
    `You are choosing between ${options} option${options === 1 ? '' : 's'} on ${criteria || 'no'} ${criteria === 1 ? 'criterion' : 'criteria'}, with ${stake} stakes.`,
  )

  const top = [...context.criterionLabels].sort((a, b) => b.weight - a.weight)[0]
  if (top) {
    items.push(
      `You weighted “${top.label}” highest (${top.weight}/5), so the ranking will hinge on it.`,
    )
  } else {
    items.push('No criteria are weighted yet — the comparison is still qualitative.')
  }

  if (options >= 2 && criteria >= 2) {
    items.push(
      'Enough structure exists for a meaningful weighted comparison; fill remaining scores and commit when the picture is stable.',
    )
  } else {
    items.push('Add more criteria or scores to sharpen the recommendation.')
  }

  return { heading: 'Where this decision stands', items }
}

function categoryName(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1)
}

function dedupe(items: string[]): string[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = item.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
