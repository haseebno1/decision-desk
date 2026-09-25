import {
  SCORE_MAX,
  SCORE_MIN,
  type Decision,
  type ScoreMatrix,
} from '@/types/decision'

export interface OptionScore {
  optionId: string
  /** Weighted total on a 0–10 scale, comparable across decisions. */
  total: number
  scoredCells: number
}

export interface ScoringSummary {
  /** Rows ordered best-first. */
  ranked: OptionScore[]
  totalCells: number
  scoredCells: number
  complete: boolean
}

/**
 * Weighted score per option: sum(score × weight) / sum(weights of scored cells),
 * rescaled from the 1–5 cell scale to 0–10. Unscored cells count as
 * neither numerator nor denominator — totals reflect what's entered so far,
 * and an option with no scored cells shows 0.
 */
export function summarizeScoring(decision: Decision): ScoringSummary {
  const scores = decision.scores ?? {}

  const ranked = decision.options.map<OptionScore>((option) => {
    const optionScores = scores[option.id] ?? {}
    let weighted = 0
    let weightSum = 0
    let scoredCells = 0
    for (const criterion of decision.criteria) {
      const score = optionScores[criterion.id]
      if (typeof score === 'number') {
        weighted += score * criterion.weight
        weightSum += criterion.weight
        scoredCells += 1
      }
    }
    const average = weightSum > 0 ? weighted / weightSum : 0
    const total =
      scoredCells > 0
        ? ((average - SCORE_MIN) / (SCORE_MAX - SCORE_MIN)) * 10
        : 0
    return {
      optionId: option.id,
      total,
      scoredCells,
    }
  })

  ranked.sort((a, b) => b.total - a.total)

  const totalCells = decision.options.length * decision.criteria.length
  const scoredCells = ranked.reduce((sum, row) => sum + row.scoredCells, 0)

  return { ranked, totalCells, scoredCells, complete: totalCells > 0 && scoredCells === totalCells }
}

export function isValidScore(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= SCORE_MIN &&
    value <= SCORE_MAX
  )
}

/** Drop score cells whose option or criterion no longer exists. */
export function pruneScores(
  scores: ScoreMatrix | undefined,
  optionIds: ReadonlySet<string>,
  criterionIds: ReadonlySet<string>,
): ScoreMatrix {
  const pruned: ScoreMatrix = {}
  for (const [optionId, cells] of Object.entries(scores ?? {})) {
    if (!optionIds.has(optionId)) continue
    const kept: Record<string, number | undefined> = {}
    for (const [criterionId, score] of Object.entries(cells)) {
      if (criterionIds.has(criterionId) && isValidScore(score)) {
        kept[criterionId] = score
      }
    }
    pruned[optionId] = kept
  }
  return pruned
}

export function formatTotal(total: number): string {
  return total.toFixed(1)
}
