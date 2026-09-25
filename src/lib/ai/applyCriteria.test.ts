import { describe, expect, it } from 'vitest'
import { WEIGHT_MAX, WEIGHT_MIN, type Criterion } from '@/types/decision'
import { mergeSuggestedCriteria } from './applyCriteria'
import type { AiCriterionSuggestion } from './types'

const criterion = (label: string, weight = 3): Criterion => ({
  id: `crit_${label.toLowerCase().replace(/\s+/g, '_')}`,
  label,
  weight,
})

const suggest = (label: string, weight = 3): AiCriterionSuggestion => ({ label, weight })

describe('mergeSuggestedCriteria', () => {
  it('accepts a suggestion the decision does not already have', () => {
    const { added, skipped } = mergeSuggestedCriteria(
      [criterion('Cost')],
      [suggest('Learning')],
    )

    expect(added).toHaveLength(1)
    expect(added[0]).toMatchObject({ label: 'Learning', weight: 3 })
    expect(added[0].id).not.toBe('')
    expect(skipped).toEqual([])
  })

  it('rejects a label the decision already has, whatever the casing or padding', () => {
    const { added, skipped } = mergeSuggestedCriteria(
      [criterion('Work-life balance'), criterion('Cost', 5)],
      [suggest('  work-life BALANCE '), suggest('Cost')],
    )

    expect(added).toEqual([])
    // `skipped` reports the trimmed form, matching what `added` would carry.
    expect(skipped).toEqual(['work-life BALANCE', 'Cost'])
  })

  it('never duplicates a label within one batch', () => {
    const { added, skipped } = mergeSuggestedCriteria(
      [],
      [suggest('Learning'), suggest('learning'), suggest('Learning')],
    )

    expect(added.map((c) => c.label)).toEqual(['Learning'])
    expect(skipped).toHaveLength(2)
  })

  it('clamps weights a provider proposes outside the 1–5 range', () => {
    const { added } = mergeSuggestedCriteria([], [
      suggest('Cost', 0),
      suggest('Speed', 9),
      suggest('Risk', 2.6),
      suggest('Budget', -3),
    ])

    expect(added.map((c) => c.weight)).toEqual([
      WEIGHT_MIN,
      WEIGHT_MAX,
      3,
      WEIGHT_MIN,
    ])
  })

  it('drops blank labels without reporting them as duplicates', () => {
    const { added, skipped } = mergeSuggestedCriteria(
      [criterion('Cost')],
      [suggest(''), suggest('   '), suggest('Cost')],
    )

    expect(added).toEqual([])
    expect(skipped).toEqual(['Cost'])
  })

  it('leaves the existing criteria untouched', () => {
    const existing = [criterion('Cost', 5)]
    const { added } = mergeSuggestedCriteria(existing, [suggest('Learning')])

    expect(existing).toHaveLength(1)
    expect(existing[0]).toEqual({ id: 'crit_cost', label: 'Cost', weight: 5 })
    expect(added).toHaveLength(1)
  })

  it('reports nothing to add when every suggestion is already present', () => {
    const { added, skipped } = mergeSuggestedCriteria(
      [criterion('Cost'), criterion('Learning')],
      [suggest('Cost'), suggest('Learning')],
    )

    expect(added).toEqual([])
    expect(skipped).toEqual(['Cost', 'Learning'])
  })

  it('handles an empty decision and an empty batch', () => {
    expect(mergeSuggestedCriteria([], [])).toEqual({ added: [], skipped: [] })
    expect(mergeSuggestedCriteria([], [suggest('Cost')]).added).toHaveLength(1)
  })
})
