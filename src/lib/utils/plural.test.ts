import { describe, expect, it } from 'vitest'
import { plural } from './plural'

describe('plural', () => {
  it('uses the singular form only for exactly one', () => {
    expect(plural(1, 'option', 'options')).toBe('option')
    expect(plural(1, 'criterion', 'criteria')).toBe('criterion')
  })

  it('uses the plural form for zero, two and many', () => {
    expect(plural(0, 'option', 'options')).toBe('options')
    expect(plural(2, 'option', 'options')).toBe('options')
    expect(plural(9, 'option', 'options')).toBe('options')
  })

  it('handles irregular nouns whose plural is not singular + s', () => {
    // The bug this helper exists to prevent: "2 criteriona".
    expect(plural(2, 'criterion', 'criteria')).toBe('criteria')
  })
})
