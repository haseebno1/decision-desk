/**
 * Theme preference: storage, resolution and application.
 *
 * Deliberately framework-free so the inline pre-paint script in index.html can
 * apply the same rules before React mounts (no flash of the wrong theme), and
 * so the logic is testable without rendering anything.
 *
 * Rules:
 *   - an explicit choice always wins;
 *   - with no choice stored, follow the OS;
 *   - anything unreadable (blocked storage, bad value) falls back to dark,
 *     which is the product's designed look.
 */

export type Theme = 'dark' | 'light'

/** Additive key — no existing stored shape is touched. */
export const THEME_STORAGE_KEY = 'decision-desk.theme.v1'

export const THEME_COLORS: Record<Theme, string> = {
  dark: '#09080d',
  light: '#f7f6fa',
}

function storage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null // private mode / blocked storage
  }
}

/** The stored preference, or null when it is unset or not a known theme. */
export function readStoredTheme(): Theme | null {
  try {
    const raw = storage()?.getItem(THEME_STORAGE_KEY)
    return raw === 'light' || raw === 'dark' ? raw : null
  } catch {
    return null
  }
}

/** Persist a choice. A failed write must never break the interface. */
export function saveTheme(theme: Theme): void {
  try {
    storage()?.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    /* theme just won't survive a reload */
  }
}

export function prefersLightTheme(): boolean {
  try {
    return window.matchMedia('(prefers-color-scheme: light)').matches
  } catch {
    return false
  }
}

/** Explicit choice wins; otherwise the OS decides. */
export function resolveInitialTheme(
  stored: Theme | null = readStoredTheme(),
  prefersLight: boolean = prefersLightTheme(),
): Theme {
  if (stored !== null) return stored
  return prefersLight ? 'light' : 'dark'
}

/** The theme currently applied to <html>. */
export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

/**
 * Paint a theme by swapping the token set on <html> (see index.css). Every
 * colour in the app resolves from those variables, so this is the whole of it.
 */
export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', THEME_COLORS[theme])
}

export function setTheme(theme: Theme): void {
  applyTheme(theme)
  saveTheme(theme)
}

/** Flip to the other theme, apply it and remember the choice. */
export function toggleTheme(): Theme {
  const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark'
  setTheme(next)
  return next
}
