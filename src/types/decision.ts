/**
 * Domain types for Decision Desk.
 *
 * These sketch the core data model that Phases 1–4 will build on:
 * capture (Phase 1), scoring (Phase 2), recommendation (Phase 3),
 * and persistence (Phase 4).
 */

export type DecisionCategory =
  | 'career'
  | 'purchase'
  | 'lifestyle'
  | 'relationships'
  | 'finance'
  | 'other'

export type StakeLevel = 'low' | 'medium' | 'high'

export const CATEGORY_LABELS: Record<DecisionCategory, string> = {
  career: 'Career',
  purchase: 'Purchase',
  lifestyle: 'Lifestyle',
  relationships: 'Relationships',
  finance: 'Finance',
  other: 'Other',
}

export const STAKE_LABELS: Record<StakeLevel, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

export const DECISION_CATEGORIES = Object.keys(
  CATEGORY_LABELS,
) as DecisionCategory[]

export const STAKE_LEVELS = Object.keys(STAKE_LABELS) as StakeLevel[]

/** Drafts are editable; decisions become immutable once committed in Phase 3. */
export type DecisionStatus = 'draft' | 'committed'

export interface DecisionOption {
  id: string
  label: string
}

export interface Criterion {
  id: string
  label: string
  /** Relative importance, 1–5. */
  weight: number
}

export const WEIGHT_MIN = 1
export const WEIGHT_MAX = 5
export const SCORE_MIN = 1
export const SCORE_MAX = 5

/** Sparse score matrix: scores[optionId][criterionId] = SCORE_MIN..SCORE_MAX. */
export type ScoreMatrix = Record<string, Record<string, number | undefined>>

export interface Decision {
  id: string
  title: string
  description?: string
  category: DecisionCategory
  stake: StakeLevel
  options: DecisionOption[]
  criteria: Criterion[]
  /** How each option scores on each criterion. Absent/missing cells are unscored. */
  scores?: ScoreMatrix
  status: DecisionStatus
  /** Present once a recommendation is committed in Phase 3. */
  outcome?: DecisionOutcome
  createdAt: string
  updatedAt: string
}

export interface DecisionOutcome {
  chosenOptionId: string
  committedAt: string
}
