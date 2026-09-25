// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  SIDEBAR_STORAGE_KEY,
  applySidebar,
  currentSidebar,
  readStoredSidebar,
  resolveInitialSidebar,
  saveSidebar,
  setSidebar,
  toggleSidebar,
} from './sidebar'

beforeEach(() => {
  window.localStorage.clear()
  delete document.documentElement.dataset.sidebar
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('readStoredSidebar', () => {
  it('is null when the user has never collapsed it', () => {
    expect(readStoredSidebar()).toBeNull()
  })

  it('returns a stored state', () => {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, 'collapsed')
    expect(readStoredSidebar()).toBe('collapsed')
  })

  it('ignores a value it does not recognise', () => {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, 'half')
    expect(readStoredSidebar()).toBeNull()
  })

  it('survives storage that refuses to be read', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(readStoredSidebar()).toBeNull()
    expect(resolveInitialSidebar(readStoredSidebar())).toBe('expanded')
  })
})

describe('sidebar state', () => {
  it('defaults to expanded', () => {
    expect(currentSidebar()).toBe('expanded')
    expect(resolveInitialSidebar(null)).toBe('expanded')
  })

  it('honours an explicit stored collapse', () => {
    expect(resolveInitialSidebar('collapsed')).toBe('collapsed')
  })

  it('applies the state as an attribute rather than a class', () => {
    applySidebar('collapsed')
    expect(document.documentElement.dataset.sidebar).toBe('collapsed')
    applySidebar('expanded')
    expect(document.documentElement.dataset.sidebar).toBe('expanded')
  })

  it('persists a choice so it survives a reload', () => {
    setSidebar('collapsed')
    expect(readStoredSidebar()).toBe('collapsed')
    expect(currentSidebar()).toBe('collapsed')
  })

  it('flips between the two states and remembers each', () => {
    expect(toggleSidebar()).toBe('collapsed')
    expect(readStoredSidebar()).toBe('collapsed')
    expect(toggleSidebar()).toBe('expanded')
    expect(readStoredSidebar()).toBe('expanded')
  })

  it('never throws when the write is rejected', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded')
    })
    expect(() => saveSidebar('collapsed')).not.toThrow()
    expect(() => setSidebar('collapsed')).not.toThrow()
    // Still applied for this session, just not persisted.
    expect(currentSidebar()).toBe('collapsed')
  })
})
