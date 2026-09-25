/**
 * Route <-> URL hash mapping. Hash routing keeps the app deployable as
 * plain static files (no server rewrites) while giving us real
 * back/forward buttons and restorable deep links.
 *
 *   #/                       home
 *   #/new                    new decision form
 *   #/decisions/:id          workspace (draft) or result (committed)
 *   #/decisions/:id/result   forced result view
 *   #/history                history timeline
 *   #/patterns               patterns (Phase 5)
 */

export type Route =
  | { name: 'home' }
  | { name: 'new-decision' }
  | { name: 'edit-decision'; id: string }
  | { name: 'result'; id: string }
  | { name: 'history' }
  | { name: 'patterns' }

export function serializeRoute(route: Route): string {
  switch (route.name) {
    case 'home':
      return '#/'
    case 'new-decision':
      return '#/new'
    case 'edit-decision':
      return `#/decisions/${encodeURIComponent(route.id)}`
    case 'result':
      return `#/decisions/${encodeURIComponent(route.id)}/result`
    case 'history':
      return '#/history'
    case 'patterns':
      return '#/patterns'
  }
}

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean)

  switch (parts[0]) {
    case undefined:
    case '':
      return { name: 'home' }
    case 'new':
      return { name: 'new-decision' }
    case 'decisions': {
      const id = parts[1] ? decodeURIComponent(parts[1]) : ''
      if (id === '') return { name: 'home' }
      if (parts[2] === 'result') return { name: 'result', id }
      return { name: 'edit-decision', id }
    }
    case 'history':
      return { name: 'history' }
    case 'patterns':
      return { name: 'patterns' }
    default:
      return { name: 'home' }
  }
}
