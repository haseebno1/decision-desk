import type { Criterion, Decision } from '@/types/decision'

export interface CategoryBreakdown {
  category: Decision['category']
  count: number
}

export interface StakeBreakdown {
  stake: Decision['stake']
  count: number
}

export interface CriterionUsage {
  /** Normalized label as typed by the user (trimmed). */
  label: string
  count: number
}

export interface PatternsReport {
  total: number
  drafts: number
  committed: number
  /** All-decision averages on the 0–10 scale. */
  averageWinnerScore: number | null
  averageDecisionSpanDays: number | null
  /** Committed decisions whose chosen option was NOT the mathematical leader. */
  overriddenCount: number
  /** Committed decisions where the final gap was under the close-call threshold. */
  closeCallCount: number
  categories: CategoryBreakdown[]
  stakes: StakeBreakdown[]
  criteria: CriterionUsage[]
  insights: string[]
}

const ORDERED_CATEGORIES: Array<Decision['category']> = [
  'career',
  'purchase',
  'lifestyle',
  'relationships',
  'finance',
  'other',
]
const ORDERED_STAKES: Array<Decision['stake']> = ['high', 'medium', 'low']
const DAY_MS = 24 * 60 * 60 * 1000

/** Filter out placeholder labels so "Option 1"-style defaults don't pollute stats. */
function meaningfulCriteria(decision: Decision): Criterion[] {
  return decision.criteria.filter(
    (c) => c.label.trim() !== '' && !/^criterion \d+$/i.test(c.label.trim()),
  )
}

function meaningfulOptions(decision: Decision): number {
  return decision.options.filter((o) => o.label.trim() !== '').length
}

/**
 * Aggregate descriptive statistics across all decisions.
 * Pure function over the store data — no UI or storage concerns.
 */
export function buildPatternsReport(decisions: Decision[]): PatternsReport {
  const drafts = decisions.filter((d) => d.status === 'draft')
  const committed = decisions.filter((d) => d.status === 'committed')

  // ---- Winner scores (all decisions with at least one scored cell) --------
  const winnerScores: number[] = []
  let overriddenCount = 0
  let closeCallCount = 0

  for (const decision of decisions) {
    const scores = decision.scores ?? {}
    const totals: Array<{ optionId: string; total: number }> = []

    for (const option of decision.options) {
      const cells = scores[option.id] ?? {}
      let weighted = 0
      let weightSum = 0
      for (const criterion of decision.criteria) {
        const score = cells[criterion.id]
        if (typeof score === 'number') {
          weighted += score * criterion.weight
          weightSum += criterion.weight
        }
      }
      if (weightSum > 0) {
        totals.push({ optionId: option.id, total: ((weighted / weightSum - 1) / 4) * 10 })
      }
    }

    if (totals.length === 0) continue
    totals.sort((a, b) => b.total - a.total)
    winnerScores.push(totals[0].total)

    if (decision.status === 'committed' && decision.outcome) {
      const leader = totals[0]
      const second = totals[1]
      if (second !== undefined && leader.total - second.total < 0.5) {
        closeCallCount += 1
      }
      if (decision.outcome.chosenOptionId !== leader.optionId) {
        overriddenCount += 1
      }
    }
  }

  const averageWinnerScore =
    winnerScores.length > 0
      ? winnerScores.reduce((sum, s) => sum + s, 0) / winnerScores.length
      : null

  // ---- Decision time: updatedAt - createdAt per decision ------------------
  const spans = decisions
    .map((d) => (new Date(d.updatedAt).getTime() - new Date(d.createdAt).getTime()) / DAY_MS)
    .filter((days) => days >= 0 && Number.isFinite(days))
  const averageDecisionSpanDays =
    spans.length > 0 ? spans.reduce((sum, s) => sum + s, 0) / spans.length : null

  // ---- Category / stake breakdowns ----------------------------------------
  const countBy = <K extends string>(keys: Array<K>, pick: (d: Decision) => K) => {
    const map = new Map<K, number>(keys.map((k) => [k, 0]))
    for (const d of decisions) {
      const key = pick(d)
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return map
  }

  const categoryCounts = countBy(ORDERED_CATEGORIES, (d) => d.category)
  const stakeCounts = countBy(ORDERED_STAKES, (d) => d.stake)

  const categories: CategoryBreakdown[] = ORDERED_CATEGORIES.map((category) => ({
    category,
    count: categoryCounts.get(category) ?? 0,
  }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count)

  const stakes: StakeBreakdown[] = ORDERED_STAKES.map((stake) => ({
    stake,
    count: stakeCounts.get(stake) ?? 0,
  }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count)

  // ---- Most-used criteria (normalized labels) -----------------------------
  const criterionCounts = new Map<string, number>()
  for (const decision of decisions) {
    for (const criterion of meaningfulCriteria(decision)) {
      const label = criterion.label.trim()
      const key = label.toLowerCase()
      criterionCounts.set(key, (criterionCounts.get(key) ?? 0) + 1)
    }
  }
  const criteria: CriterionUsage[] = [...criterionCounts.entries()]
    .map(([, count]) => ({ label: '', count }))
    .map((row, index) => ({
      // recover display casing from the first matching decision
      label:
        decisions
          .flatMap((d) => meaningfulCriteria(d))
          .find((c) => c.label.trim().toLowerCase() === [...criterionCounts.keys()][index])
          ?.label.trim() ?? '',
      count: row.count,
    }))
    .filter((row) => row.label !== '')
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 8)

  // ---- Insights ------------------------------------------------------------
  const insights: string[] = []

  const topCategory = categories[0]
  if (topCategory && topCategory.count >= 2) {
    const share = Math.round((topCategory.count / decisions.length) * 100)
    insights.push(
      `${CATEGORY_LABEL(topCategory.category)} is your most-decided area — ${topCategory.count} of ${decisions.length} decisions (${share}%).`,
    )
  }

  const topStake = stakes[0]
  if (topStake && topStake.count >= 2) {
    insights.push(
      `Most of your decisions carry ${topStake.stake} stakes (${topStake.count} of ${decisions.length}).`,
    )
  }

  const topCriterion = criteria[0]
  if (topCriterion && topCriterion.count >= 2) {
    insights.push(
      `“${topCriterion.label}” is your most-used criterion — it shaped ${topCriterion.count} decisions.`,
    )
  }

  if (averageWinnerScore !== null) {
    insights.push(
      `Winning options average ${averageWinnerScore.toFixed(1)}/10 across ${winnerScores.length} scored decision${winnerScores.length === 1 ? '' : 's'}.`,
    )
  }

  if (averageDecisionSpanDays !== null && decisions.length >= 2) {
    insights.push(
      averageDecisionSpanDays < 1
        ? `You tend to decide within a day of capturing the question.`
        : `Decisions stay open about ${Math.round(averageDecisionSpanDays)} day${Math.round(averageDecisionSpanDays) === 1 ? '' : 's'} on average.`,
    )
  }

  if (committed.length > 0) {
    if (overriddenCount > 0) {
      insights.push(
        `You went against the math ${overriddenCount} time${overriddenCount === 1 ? '' : 's'} — gut over weights.`,
      )
    } else {
      insights.push(`Every commitment so far followed the weighted math.`)
    }
    if (closeCallCount > 0) {
      insights.push(
        `${closeCallCount} decision${closeCallCount === 1 ? ' was' : 's were'} a close call (gap under 0.5).`,
      )
    }
  }

  return {
    total: decisions.length,
    drafts: drafts.length,
    committed: committed.length,
    averageWinnerScore,
    averageDecisionSpanDays,
    overriddenCount,
    closeCallCount,
    categories,
    stakes,
    criteria,
    insights,
  }
}

function CATEGORY_LABEL(category: Decision['category']): string {
  const labels: Record<Decision['category'], string> = {
    career: 'Career',
    purchase: 'Purchase',
    lifestyle: 'Lifestyle',
    relationships: 'Relationships',
    finance: 'Finance',
    other: 'Other',
  }
  return labels[category]
}

/** Mean option count across decisions — used by the UI's "options per decision" stat. */
export function averageOptionsPerDecision(decisions: Decision[]): number | null {
  if (decisions.length === 0) return null
  const total = decisions.reduce((sum, d) => sum + meaningfulOptions(d), 0)
  return total / decisions.length
}
