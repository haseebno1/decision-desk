// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  THEME_COLORS,
  THEME_STORAGE_KEY,
  applyTheme,
  currentTheme,
  prefersLightTheme,
  readStoredTheme,
  resolveInitialTheme,
  setTheme,
  toggleTheme,
} from './theme'

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches,
    media: query,
  }) as unknown as MediaQueryList)
}

function addThemeColorMeta() {
  const meta = document.createElement('meta')
  meta.setAttribute('name', 'theme-color')
  meta.setAttribute('content', THEME_COLORS.dark)
  document.head.appendChild(meta)
  return meta
}

beforeEach(() => {
  window.localStorage.clear()
  delete document.documentElement.dataset.theme
  document.head.innerHTML = ''
  stubMatchMedia(false)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('readStoredTheme', () => {
  it('is null when the user has never chosen', () => {
    expect(readStoredTheme()).toBeNull()
  })

  it('returns a stored choice', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'light')
    expect(readStoredTheme()).toBe('light')
  })

  it('ignores a value it does not recognise', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'sepia')
    expect(readStoredTheme()).toBeNull()
  })

  it('survives storage that refuses to be read', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(readStoredTheme()).toBeNull()
  })
})

describe('resolveInitialTheme', () => {
  it('let an explicit choice win over the operating system', () => {
    expect(resolveInitialTheme('light', false)).toBe('light')
    expect(resolveInitialTheme('dark', true)).toBe('dark')
  })

  it('follow the operating system when nothing is stored', () => {
    expect(resolveInitialTheme(null, true)).toBe('light')
    expect(resolveInitialTheme(null, false)).toBe('dark')
  })

  it('fall back to dark when storage is unreadable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(resolveInitialTheme()).toBe('dark')
  })

  it('fall back to dark where matchMedia is unavailable', () => {
    vi.stubGlobal('matchMedia', undefined)
    expect(prefersLightTheme()).toBe(false)
    expect(resolveInitialTheme(null)).toBe('dark')
  })
})

describe('applyTheme', () => {
  it('swap the token set on <html> and keep the browser chrome in step', () => {
    const meta = addThemeColorMeta()

    applyTheme('light')
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(meta.getAttribute('content')).toBe(THEME_COLORS.light)

    applyTheme('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(meta.getAttribute('content')).toBe(THEME_COLORS.dark)
  })

  it('not require a theme-color meta to exist', () => {
    expect(() => applyTheme('light')).not.toThrow()
  })
})

describe('setTheme and toggleTheme', () => {
  it('record the choice so it survives a reload', () => {
    setTheme('light')
    expect(readStoredTheme()).toBe('light')
    expect(currentTheme()).toBe('light')
  })

  it('flip to the other theme and remember it', () => {
    // No attribute yet: dark is the designed default.
    expect(currentTheme()).toBe('dark')

    expect(toggleTheme()).toBe('light')
    expect(readStoredTheme()).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')

    expect(toggleTheme()).toBe('dark')
    expect(readStoredTheme()).toBe('dark')
  })

  it('never throw when the write is rejected', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded')
    })
    expect(() => setTheme('light')).not.toThrow()
    // The theme still applied, it just will not persist.
    expect(currentTheme()).toBe('light')
  })
})
