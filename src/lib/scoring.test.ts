import { describe, expect, it } from 'vitest'
import {
  formatTotal,
  isValidScore,
  pruneScores,
  summarizeScoring,
} from './scoring'
import { criterion, makeDecision, makeScores } from './testFixtures'

describe('summarizeScoring', () => {
  it('computes weighted totals on the 0-10 scale', () => {
    const decision = makeDecision({
      criteria: [criterion('price', 'Price', 5), criterion('port', 'Portability', 3)],
      scores: makeScores([
        // MacBook: (3*5 + 5*3)/8 = 3.75 -> (3.75-1)/4*10 = 6.875
        { optionId: 'opt-a', criterionId: 'price', score: 3 },
        { optionId: 'opt-a', criterionId: 'port', score: 5 },
        // ThinkPad: (4*5 + 2*3)/8 = 3.25 -> 5.625
        { optionId: 'opt-b', criterionId: 'price', score: 4 },
        { optionId: 'opt-b', criterionId: 'port', score: 2 },
      ]),
    })

    const summary = summarizeScoring(decision)

    expect(summary.ranked[0]).toMatchObject({ optionId: 'opt-a', scoredCells: 2 })
    expect(summary.ranked[0].total).toBeCloseTo(6.875, 5)
    expect(summary.ranked[1].total).toBeCloseTo(5.625, 5)
    expect(summary.complete).toBe(true)
    expect(summary.totalCells).toBe(4)
  })

  it('averages only over scored cells so partial data stays honest', () => {
    const decision = makeDecision({
      criteria: [criterion('price', 'Price', 5), criterion('port', 'Portability', 3)],
      scores: makeScores([{ optionId: 'opt-a', criterionId: 'price', score: 5 }]),
    })

    const summary = summarizeScoring(decision)

    // Only the price cell: average 5 -> 10/10, portability cell ignored entirely.
    expect(summary.ranked[0].total).toBe(10)
    expect(summary.ranked[0].scoredCells).toBe(1)
    expect(summary.complete).toBe(false)
    expect(summary.scoredCells).toBe(1)
  })

  it('gives unscored options a total of exactly 0 (not negative)', () => {
    const decision = makeDecision({
      criteria: [criterion('price', 'Price', 5)],
      scores: makeScores([{ optionId: 'opt-a', criterionId: 'price', score: 3 }]),
    })

    const summary = summarizeScoring(decision)

    expect(summary.ranked[1]).toMatchObject({ optionId: 'opt-b', total: 0, scoredCells: 0 })
  })

  it('handles a decision with no criteria at all', () => {
    const summary = summarizeScoring(makeDecision())

    expect(summary.ranked).toHaveLength(2)
    expect(summary.totalCells).toBe(0)
    expect(summary.scoredCells).toBe(0)
    expect(summary.complete).toBe(false)
    summary.ranked.forEach((row) => expect(row.total).toBe(0))
  })

  it('ranks ties stably by keeping equal totals ordered', () => {
    const decision = makeDecision({
      criteria: [criterion('c', 'C', 2)],
      scores: makeScores([
        { optionId: 'opt-a', criterionId: 'c', score: 4 },
        { optionId: 'opt-b', criterionId: 'c', score: 4 },
      ]),
    })

    const summary = summarizeScoring(decision)

    expect(summary.ranked[0].total).toBe(summary.ranked[1].total)
  })
})

describe('isValidScore', () => {
  it('accepts only integers 1-5', () => {
    expect(isValidScore(1)).toBe(true)
    expect(isValidScore(5)).toBe(true)
    expect(isValidScore(0)).toBe(false)
    expect(isValidScore(6)).toBe(false)
    expect(isValidScore(3.5)).toBe(false)
    expect(isValidScore('3')).toBe(false)
    expect(isValidScore(undefined)).toBe(false)
  })
})

describe('pruneScores', () => {
  it('drops cells for deleted options and criteria and out-of-range scores', () => {
    const scores = makeScores([
      { optionId: 'opt-a', criterionId: 'price', score: 3 },
      { optionId: 'opt-a', criterionId: 'deleted-crit', score: 4 },
      { optionId: 'deleted-opt', criterionId: 'price', score: 2 },
      { optionId: 'opt-b', criterionId: 'price', score: 9 }, // invalid
    ])

    const pruned = pruneScores(
      scores,
      new Set(['opt-a', 'opt-b']),
      new Set(['price']),
    )

    expect(pruned).toEqual({
      'opt-a': { price: 3 },
      'opt-b': {},
    })
  })

  it('tolerates an undefined matrix', () => {
    expect(pruneScores(undefined, new Set(['opt-a']), new Set(['c']))).toEqual({})
  })
})

describe('formatTotal', () => {
  it('formats to one decimal', () => {
    expect(formatTotal(5.9375)).toBe('5.9')
    expect(formatTotal(0)).toBe('0.0')
  })
})
