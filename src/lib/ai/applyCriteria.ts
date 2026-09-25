import { generateId } from '@/lib/utils/generateId'
import { WEIGHT_MAX, WEIGHT_MIN, type Criterion } from '@/types/decision'
import type { AiCriterionSuggestion } from './types'

export interface MergeResult {
  /** Criteria to append, each with a fresh id and a clamped weight. */
  added: Criterion[]
  /** Suggestion labels dropped because the decision already has them. */
  skipped: string[]
}

/**
 * Turn provider suggestions into criteria a decision does not already have.
 *
 * This is the guard behind the panel's Apply button. Labels are trimmed and
 * matched case-insensitively against the criteria already on the decision *and*
 * against every suggestion accepted earlier in the same batch, so applying
 * twice — or applying after hand-editing a label into a collision — can never
 * create duplicates. Weights are clamped to the 1–5 range the app uses, since
 * a provider is free to propose a 0 or a 9.
 *
 * Framework-free on purpose: it is the one part of the Apply flow worth
 * unit-testing, and it belongs on the same side of the boundary as the rest of
 * the engine (`src/lib` never imports React).
 */
export function mergeSuggestedCriteria(
  existing: ReadonlyArray<Criterion>,
  suggestions: ReadonlyArray<AiCriterionSuggestion>,
): MergeResult {
  const taken = new Set(existing.map((criterion) => criterion.label.trim().toLowerCase()))
  const added: Criterion[] = []
  const skipped: string[] = []

  for (const suggestion of suggestions) {
    const label = suggestion.label.trim()
    const key = label.toLowerCase()

    if (label === '' || taken.has(key)) {
      // A blank label is noise, not a duplicate — only real collisions count.
      if (label !== '') skipped.push(label)
      continue
    }

    taken.add(key)
    added.push({
      id: generateId('crit'),
      label,
      weight: Math.min(WEIGHT_MAX, Math.max(WEIGHT_MIN, Math.round(suggestion.weight))),
    })
  }

  return { added, skipped }
}
