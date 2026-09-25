import { describe, expect, it } from 'vitest'
import { parseHash, serializeRoute } from './routes'

describe('route round trips', () => {
  it('round-trips every route kind', () => {
    const routes = [
      { name: 'home' },
      { name: 'new-decision' },
      { name: 'edit-decision', id: 'dec_123' },
      { name: 'result', id: 'dec_123' },
      { name: 'history' },
      { name: 'patterns' },
    ] as const

    for (const route of routes) {
      expect(parseHash(serializeRoute(route))).toEqual(route)
    }
  })

  it('encodes risky ids safely', () => {
    const hash = serializeRoute({ name: 'result', id: 'dec/a b' })
    expect(hash).toContain('%2F')
    expect(parseHash(hash)).toEqual({ name: 'result', id: 'dec/a b' })
  })
})

describe('parseHash resilience', () => {
  it('falls back to home for unknown or malformed hashes', () => {
    expect(parseHash('')).toEqual({ name: 'home' })
    expect(parseHash('#/')).toEqual({ name: 'home' })
    expect(parseHash('#/nonsense')).toEqual({ name: 'home' })
    expect(parseHash('#/decisions/')).toEqual({ name: 'home' })
  })
})
