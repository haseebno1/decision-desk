/**
 * Pick the singular or plural form of a noun for a count.
 *
 * Small on purpose, but worth having: the inline version is easy to get wrong
 * for irregular nouns. `criterion` + `'s'` reads as "criterions", and the
 * plural of criterion is *criteria* — a typo that shipped in the AI panel's
 * Apply button as "criteriona" because the suffix, not the word, was wrong.
 */
export function plural(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural
}
