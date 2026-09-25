import { describe, expect, it } from 'vitest'
import { buildRecommendation } from './recommendation'
import { criterion, makeDecision, makeScores } from './testFixtures'

const price = (weight = 5) => criterion('price', 'Price', weight)
const port = (weight = 3) => criterion('port', 'Portability', weight)

describe('buildRecommendation', () => {
  it('names the weighted winner with a transparent gap', () => {
    const decision = makeDecision({
      criteria: [price(), port()],
      scores: makeScores([
        { optionId: 'opt-a', criterionId: 'price', score: 3 },
        { optionId: 'opt-a', criterionId: 'port', score: 5 },
        { optionId: 'opt-b', criterionId: 'price', score: 4 },
        { optionId: 'opt-b', criterionId: 'port', score: 2 },
      ]),
    })

    const rec = buildRecommendation(decision)

    expect(rec?.winner.id).toBe('opt-a')
    expect(rec?.gap).toBeCloseTo(6.875 - 5.625, 5)
    expect(rec?.isCloseCall).toBe(false)
  })

  it('flags close calls under the threshold (winner B by 0.227)', () => {
    // A: (3*10 + 1*1)/11 = 2.8181... -> (2.8181-1)/4*10 = 4.5454...
    // B: (3*10 + 2*1)/11 = 2.9090... -> 4.7727...
    // gap = 0.2273 < 0.5 -> close call
    const decision = makeDecision({
      criteria: [criterion('a', 'A', 10), criterion('b', 'B', 1)],
      scores: makeScores([
        { optionId: 'opt-a', criterionId: 'a', score: 3 },
        { optionId: 'opt-a', criterionId: 'b', score: 1 },
        { optionId: 'opt-b', criterionId: 'a', score: 3 },
        { optionId: 'opt-b', criterionId: 'b', score: 2 },
      ]),
    })

    const rec = buildRecommendation(decision)

    expect(rec?.winner.id).toBe('opt-b')
    expect(rec?.gap).toBeCloseTo(0.2273, 3)
    expect(rec?.isCloseCall).toBe(true)
    expect(rec?.reasons.join(' ')).toMatch(/could flip this result/)
  })

  it('is not a close call at a wide margin', () => {
    const decision = makeDecision({
      criteria: [price()],
      scores: makeScores([
        { optionId: 'opt-a', criterionId: 'price', score: 5 },
        { optionId: 'opt-b', criterionId: 'price', score: 1 },
      ]),
    })

    const rec = buildRecommendation(decision)

    expect(rec?.isCloseCall).toBe(false)
    expect(rec?.gap).toBeCloseTo(10, 5)
  })

  it('detects trade-offs where the winner loses a criterion', () => {
    const decision = makeDecision({
      criteria: [price(), port()],
      scores: makeScores([
        { optionId: 'opt-a', criterionId: 'price', score: 3 },
        { optionId: 'opt-a', criterionId: 'port', score: 5 },
        { optionId: 'opt-b', criterionId: 'price', score: 4 },
        { optionId: 'opt-b', criterionId: 'port', score: 2 },
      ]),
    })

    const rec = buildRecommendation(decision)

    expect(rec?.tradeOffs.map((t) => t.label)).toEqual(['Price'])
  })

  it('reports no trade-offs when the winner leads everywhere', () => {
    const decision = makeDecision({
      criteria: [price(), port()],
      scores: makeScores([
        { optionId: 'opt-a', criterionId: 'price', score: 5 },
        { optionId: 'opt-a', criterionId: 'port', score: 5 },
        { optionId: 'opt-b', criterionId: 'price', score: 2 },
        { optionId: 'opt-b', criterionId: 'port', score: 2 },
      ]),
    })

    const rec = buildRecommendation(decision)

    expect(rec?.tradeOffs).toEqual([])
  })

  it('returns null with fewer than two options', () => {
    const decision = makeDecision({
      options: [{ id: 'opt-a', label: 'Only' }],
      criteria: [price()],
      scores: makeScores([{ optionId: 'opt-a', criterionId: 'price', score: 4 }]),
    })

    expect(buildRecommendation(decision)).toBeNull()
  })

  it('returns null when nothing is scored', () => {
    const decision = makeDecision({ criteria: [price()] })
    expect(buildRecommendation(decision)).toBeNull()
  })

  it('still recommends from partial scores and says the ranking is provisional', () => {
    const decision = makeDecision({
      criteria: [price(), port()],
      scores: makeScores([{ optionId: 'opt-a', criterionId: 'price', score: 4 }]),
    })

    const rec = buildRecommendation(decision)

    expect(rec?.winner.id).toBe('opt-a')
    expect(rec?.reasons.join(' ')).toMatch(/provisional/)
  })

  it('treats tied criterion leaders as no leader (no phantom trade-offs)', () => {
    const decision = makeDecision({
      criteria: [price(5), criterion('tie', 'Tie', 1)],
      scores: makeScores([
        { optionId: 'opt-a', criterionId: 'price', score: 4 },
        { optionId: 'opt-a', criterionId: 'tie', score: 3 },
        { optionId: 'opt-b', criterionId: 'price', score: 4 },
        { optionId: 'opt-b', criterionId: 'tie', score: 3 },
      ]),
    })

    const rec = buildRecommendation(decision)

    expect(rec?.tradeOffs).toEqual([])
    expect(rec?.contributions.every((c) => c.leaderOptionId === undefined)).toBe(true)
  })

  it('ignores trade-off criteria the winner never scored', () => {
    // opt-a wins overall but never scored 'port'; opt-b leads port.
    // That must NOT be listed as a trade-off the winner accepts.
    const decision = makeDecision({
      criteria: [price(), port()],
      scores: makeScores([
        { optionId: 'opt-a', criterionId: 'price', score: 5 },
        { optionId: 'opt-b', criterionId: 'price', score: 2 },
        { optionId: 'opt-b', criterionId: 'port', score: 4 },
      ]),
    })

    const rec = buildRecommendation(decision)

    expect(rec?.winner.id).toBe('opt-a')
    expect(rec?.tradeOffs).toEqual([])
  })
})
