import type { Criterion, Decision, DecisionOption, ScoreMatrix } from '@/types/decision'

export const OPTIONS: DecisionOption[] = [
  { id: 'opt-a', label: 'MacBook Air M4' },
  { id: 'opt-b', label: 'ThinkPad X1 Carbon' },
]

export function criterion(
  id: string,
  label: string,
  weight: number,
): Criterion {
  return { id, label, weight }
}

export function makeDecision(overrides: Partial<Decision> = {}): Decision {
  return {
    id: 'dec-1',
    title: 'Which laptop should I buy?',
    category: 'purchase',
    stake: 'high',
    options: OPTIONS.map((o) => ({ ...o })),
    criteria: [],
    status: 'draft',
    createdAt: '2026-09-25T10:00:00.000Z',
    updatedAt: '2026-09-25T10:00:00.000Z',
    ...overrides,
  }
}

export function makeScores(
  entries: Array<{ optionId: string; criterionId: string; score: number }>,
): ScoreMatrix {
  const scores: ScoreMatrix = {}
  for (const { optionId, criterionId, score } of entries) {
    scores[optionId] = { ...scores[optionId], [criterionId]: score }
  }
  return scores
}
