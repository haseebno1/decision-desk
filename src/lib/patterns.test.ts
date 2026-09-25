import { describe, expect, it } from 'vitest'
import { averageOptionsPerDecision, buildPatternsReport } from './patterns'
import {
  criterion,
  makeDecision,
  makeScores,
  OPTIONS,
} from './testFixtures'
import type { Decision } from '@/types/decision'

function scoredLaptopDecision(overrides: Partial<Decision> = {}): Decision {
  return makeDecision({
    criteria: [criterion('price', 'Price', 5), criterion('port', 'Portability', 3)],
    scores: makeScores([
      { optionId: 'opt-a', criterionId: 'price', score: 3 },
      { optionId: 'opt-a', criterionId: 'port', score: 5 },
      { optionId: 'opt-b', criterionId: 'price', score: 4 },
      { optionId: 'opt-b', criterionId: 'port', score: 2 },
    ]),
    ...overrides,
  })
}

describe('buildPatternsReport', () => {
  it('returns an empty report for no decisions', () => {
    const report = buildPatternsReport([])

    expect(report.total).toBe(0)
    expect(report.averageWinnerScore).toBeNull()
    expect(report.averageDecisionSpanDays).toBeNull()
    expect(report.categories).toEqual([])
    expect(report.stakes).toEqual([])
    expect(report.criteria).toEqual([])
    expect(report.insights).toEqual([])
  })

  it('counts drafts and committed separately', () => {
    const report = buildPatternsReport([
      scoredLaptopDecision({ status: 'committed' }),
      makeDecision({ title: 'Draft two' }),
      makeDecision({ title: 'Draft three' }),
    ])

    expect(report.total).toBe(3)
    expect(report.committed).toBe(1)
    expect(report.drafts).toBe(2)
  })

  it('breaks down categories and stakes, dropping empty buckets', () => {
    const report = buildPatternsReport([
      scoredLaptopDecision({ category: 'purchase', stake: 'high' }),
      makeDecision({ title: 'B', category: 'purchase', stake: 'medium' }),
      makeDecision({ title: 'C', category: 'career', stake: 'high' }),
    ])

    expect(report.categories).toEqual([
      { category: 'purchase', count: 2 },
      { category: 'career', count: 1 },
    ])
    expect(report.stakes).toEqual([
      { stake: 'high', count: 2 },
      { stake: 'medium', count: 1 },
    ])
  })

  it('aggregates most-used criteria case-insensitively, ignoring placeholders', () => {
    const report = buildPatternsReport([
      scoredLaptopDecision({
        criteria: [criterion('c1', 'Price', 5), criterion('c2', '  ', 3)],
        scores: makeScores([{ optionId: 'opt-a', criterionId: 'c1', score: 3 }]),
      }),
      makeDecision({
        title: 'Second',
        criteria: [criterion('c3', 'price', 2), criterion('c4', 'Portability', 1)],
        scores: makeScores([{ optionId: 'opt-a', criterionId: 'c3', score: 3 }]),
      }),
      makeDecision({
        title: 'Placeholder only',
        criteria: [criterion('c5', 'Criterion 1', 1)],
      }),
    ])

    expect(report.criteria).toEqual([
      { label: 'Price', count: 2 },
      { label: 'Portability', count: 1 },
    ])
  })

  it('averages winner scores across scored decisions only', () => {
    const report = buildPatternsReport([
      scoredLaptopDecision(), // winner 6.875
      makeDecision({
        title: 'Unscored',
        criteria: [criterion('p', 'Price', 1)],
      }),
    ])

    expect(report.averageWinnerScore).toBeCloseTo(6.875, 5)
  })

  it('detects overridden commitments (chose against the math)', () => {
    const committed = scoredLaptopDecision({ status: 'committed' })
    committed.outcome = {
      chosenOptionId: OPTIONS[1].id, // leader is opt-a, user chose opt-b
      committedAt: '2026-09-26T10:00:00.000Z',
    }

    const report = buildPatternsReport([committed])

    expect(report.overriddenCount).toBe(1)
    expect(report.insights.join(' ')).toMatch(/against the math/)
  })

  it('counts close-call commitments and reports compliance otherwise', () => {
    // gap = 6.875 - 5.625 = 1.25 -> NOT a close call, followed the math
    const wideCommitted = scoredLaptopDecision({ status: 'committed' })
    wideCommitted.outcome = {
      chosenOptionId: 'opt-a',
      committedAt: '2026-09-26T10:00:00.000Z',
    }

    const report = buildPatternsReport([wideCommitted])

    expect(report.closeCallCount).toBe(0)
    expect(report.overriddenCount).toBe(0)
    expect(report.insights.join(' ')).toMatch(/followed the weighted math/)
  })

  it('computes average decision span in days', () => {
    const report = buildPatternsReport([
      makeDecision({
        createdAt: '2026-09-20T00:00:00.000Z',
        updatedAt: '2026-09-22T00:00:00.000Z', // 2 days
      }),
      makeDecision({
        title: 'B',
        createdAt: '2026-09-23T00:00:00.000Z',
        updatedAt: '2026-09-24T00:00:00.000Z', // 1 day
      }),
    ])

    expect(report.averageDecisionSpanDays).toBeCloseTo(1.5, 5)
    expect(report.insights.join(' ')).toMatch(/about 2 days on average/)
  })

  it('produces no insights for a single unscored decision', () => {
    const report = buildPatternsReport([makeDecision()])

    expect(report.insights).toEqual([])
  })
})

describe('averageOptionsPerDecision', () => {
  it('averages over non-empty option labels', () => {
    const decisions = [
      makeDecision({
        options: [
          { id: 'o1', label: 'A' },
          { id: 'o2', label: '' },
          { id: 'o3', label: 'C' },
        ],
      }),
      makeDecision(),
    ]

    // First: 2 meaningful of 3 (empty filtered out); second: 2 by default.
    // If empties were counted the average would be 2.5 instead of 2.
    expect(averageOptionsPerDecision(decisions)).toBe(2)
  })

  it('returns null for no decisions', () => {
    expect(averageOptionsPerDecision([])).toBeNull()
  })
})
