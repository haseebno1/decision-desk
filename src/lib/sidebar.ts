/**
 * Desktop sidebar preference (expanded / collapsed).
 *
 * Same shape as `src/lib/theme.ts`: framework-free so the inline pre-paint
 * script in index.html can apply it before React mounts (a collapsed sidebar
 * must not flash open), and so the rules are testable without a renderer.
 *
 * Only affects desktop layout — the mobile shell has no sidebar.
 */

export type SidebarState = 'expanded' | 'collapsed'

/** Additive key — no existing stored shape is touched. */
export const SIDEBAR_STORAGE_KEY = 'decision-desk.sidebar.v1'

function storage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null // private mode / blocked storage
  }
}

export function readStoredSidebar(): SidebarState | null {
  try {
    const raw = storage()?.getItem(SIDEBAR_STORAGE_KEY)
    return raw === 'expanded' || raw === 'collapsed' ? raw : null
  } catch {
    return null
  }
}

export function saveSidebar(state: SidebarState): void {
  try {
    storage()?.setItem(SIDEBAR_STORAGE_KEY, state)
  } catch {
    /* the preference just won't survive a reload */
  }
}

/** Expanded is the designed default: navigation stays visible until asked. */
export function resolveInitialSidebar(stored: SidebarState | null): SidebarState {
  return stored ?? 'expanded'
}

/** The state currently applied to <html>. */
export function currentSidebar(): SidebarState {
  return document.documentElement.dataset.sidebar === 'collapsed'
    ? 'collapsed'
    : 'expanded'
}

export function applySidebar(state: SidebarState): void {
  document.documentElement.dataset.sidebar = state
}

export function setSidebar(state: SidebarState): void {
  applySidebar(state)
  saveSidebar(state)
}

export function toggleSidebar(): SidebarState {
  const next: SidebarState = currentSidebar() === 'expanded' ? 'collapsed' : 'expanded'
  setSidebar(next)
  return next
}
