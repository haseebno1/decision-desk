/**
 * AI adapter layer. The rest of the app depends only on this interface,
 * never on a concrete provider — so AI stays an optional enhancement.
 */

export type AiCapability = 'clarifying-questions' | 'criteria-suggestions' | 'summary'

export interface AiDecisionContext {
  title: string
  description?: string
  category: string
  stake: string
  optionLabels: string[]
  criterionLabels: Array<{ label: string; weight: number }>
}

export interface AiAssistRequest {
  capability: AiCapability
  context: AiDecisionContext
}

export interface AiCriterionSuggestion {
  label: string
  /** 1–5. Providers may propose a weight; the UI clamps it before applying. */
  weight: number
}

/** Weight used when a provider suggests a criterion without one. */
export const AI_SUGGESTED_WEIGHT = 3

export interface AiAssistResult {
  /** Short human-readable header for the response block. */
  heading: string
  /** Content lines, already trimmed and de-duplicated. */
  items: string[]
  /**
   * Structured output for `criteria-suggestions`, so the UI can *add* the
   * suggestions to the decision rather than only displaying them. Optional —
   * a provider that cannot produce structure simply omits it, and the panel
   * falls back to showing the prose lines.
   */
  suggestedCriteria?: AiCriterionSuggestion[]
}

export interface AiProvider {
  readonly id: string
  readonly label: string
  readonly requiresSetup: boolean
  /** Quick availability probe (keys configured, etc.). */
  isConfigured(): boolean
  assist(request: AiAssistRequest): Promise<AiAssistResult>
}

export class AiProviderError extends Error {
  readonly providerId: string

  constructor(message: string, providerId: string) {
    super(message)
    this.name = 'AiProviderError'
    this.providerId = providerId
  }
}
