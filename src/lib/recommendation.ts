import { formatTotal, summarizeScoring } from './scoring'
import type { Decision, DecisionOption } from '@/types/decision'

/**
 * Gap (on the 0–10 scale) below which the result is flagged as a close call.
 * 0.5 ≈ the full swing of a single weight-1 criterion, so anything tighter
 * can flip with one re-score.
 */
export const CLOSE_CALL_THRESHOLD = 0.5

export interface CriterionContribution {
  criterionId: string
  label: string
  weight: number
  /** optionId -> raw 1–5 score. Missing entry = unscored cell. */
  scoresByOption: Record<string, number>
  /** optionId -> points this criterion added to that option's weighted average. */
  contributions: Record<string, number>
  /** Option that wins this criterion, if scores differ. */
  leaderOptionId?: string
}

export interface Recommendation {
  winner: DecisionOption
  /** 0–10 gap between the top two options; Infinity when only one option has scores. */
  gap: number
  isCloseCall: boolean
  /** Criteria where the winner loses to another option. */
  tradeOffs: CriterionContribution[]
  contributions: CriterionContribution[]
  /** Human-readable reasoning, in presentation order. */
  reasons: string[]
  ranked: Array<{ optionId: string; label: string; total: number }>
}

/**
 * Derive a transparent recommendation from a decision's criteria and scores.
 * Pure function — no storage or UI concerns.
 */
export function buildRecommendation(decision: Decision): Recommendation | null {
  if (decision.options.length < 2) return null

  const summary = summarizeScoring(decision)
  if (summary.scoredCells === 0) return null

  const optionById = new Map(decision.options.map((o) => [o.id, o]))
  const scored = summary.ranked.filter((row) => row.scoredCells > 0)
  const winnerRow = scored[0]
  const winner = optionById.get(winnerRow.optionId)
  if (!winner) return null

  const gap =
    scored.length >= 2 ? winnerRow.total - scored[1].total : Number.POSITIVE_INFINITY
  const isCloseCall = gap < CLOSE_CALL_THRESHOLD

  const contributions = buildContributions(decision)

  const tradeOffs = contributions.filter(
    (c) =>
      c.leaderOptionId !== undefined &&
      c.leaderOptionId !== winner.id &&
      winner.id in c.scoresByOption,
  )

  const reasons: string[] = []
  reasons.push(
    `“${winner.label}” scores ${formatTotal(winnerRow.total)}/10 across the criteria you weighted.`,
  )
  if (scored.length >= 2) {
    reasons.push(
      `That is ${formatTotal(gap)} points ahead of “${scored[1] ? (optionById.get(scored[1].optionId)?.label ?? '') : ''}” (${formatTotal(scored[1].total)}/10).`,
    )
  }
  if (tradeOffs.length > 0) {
    reasons.push(
      `It loses on ${tradeOffs.map((c) => `“${c.label}”`).join(', ')} — you're accepting that trade-off.`,
    )
  }
  if (isCloseCall) {
    reasons.push(
      `The gap is under ${CLOSE_CALL_THRESHOLD} points, so a single re-score could flip this result.`,
    )
  }
  if (!summary.complete) {
    reasons.push(
      `${summary.totalCells - summary.scoredCells} cell(s) are still unscored, so this ranking is provisional.`,
    )
  }

  return {
    winner,
    gap,
    isCloseCall,
    tradeOffs,
    contributions,
    reasons,
    ranked: summary.ranked.map((row) => ({
      optionId: row.optionId,
      label: optionById.get(row.optionId)?.label ?? row.optionId,
      total: row.total,
    })),
  }
}

function buildContributions(decision: Decision): CriterionContribution[] {
  const scores = decision.scores ?? {}

  return decision.criteria.map((criterion) => {
    const scoresByOption: Record<string, number> = {}
    const contributions: Record<string, number> = {}
    let leaderOptionId: string | undefined
    let bestScore = Number.NEGATIVE_INFINITY
    let tied = false

    for (const option of decision.options) {
      const score = scores[option.id]?.[criterion.id]
      if (typeof score === 'number') {
        scoresByOption[option.id] = score
        contributions[option.id] = (score * criterion.weight) / 5
        if (score > bestScore) {
          bestScore = score
          leaderOptionId = option.id
          tied = false
        } else if (score === bestScore) {
          tied = true
        }
      }
    }

    return {
      criterionId: criterion.id,
      label: criterion.label.trim() !== '' ? criterion.label : 'Unnamed criterion',
      weight: criterion.weight,
      scoresByOption,
      contributions,
      leaderOptionId: tied ? undefined : leaderOptionId,
    }
  })
}
