import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { HomeScreen } from '@/features/home/HomeScreen'
import { DecisionForm } from '@/features/decisions/DecisionForm'
import { DecisionStoreProvider } from '@/features/decisions/DecisionStoreContext'
import { useDecisions } from '@/features/decisions/decisionStore'
import { DecisionWorkspace } from '@/features/decisions/DecisionWorkspace'
import { ResultScreen } from '@/features/decisions/ResultScreen'
import { ToastProvider } from '@/features/decisions/ToastContext'
import { useToast } from '@/features/decisions/toastStore'
import { HistoryScreen } from '@/features/history/HistoryScreen'
import { PatternsScreen } from '@/features/patterns/PatternsScreen'
import { parseHash, serializeRoute, type Route } from '@/lib/routes'

const NAV_ITEMS: ReadonlyArray<{ id: string; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'new-decision', label: 'New decision' },
  { id: 'history', label: 'History' },
  { id: 'patterns', label: 'Patterns' },
]

/** Page titles per top-level route, set on navigation for screen-reader/UX context. */
const TITLES: Record<Route['name'], string> = {
  home: 'Decision Desk',
  'new-decision': 'New decision — Decision Desk',
  'edit-decision': 'Decision — Decision Desk',
  result: 'Recommendation — Decision Desk',
  history: 'History — Decision Desk',
  patterns: 'Patterns — Decision Desk',
}

function AppRoutes() {
  const { decisions } = useDecisions()
  const [route, setRouteState] = useState<Route>(() => parseHash(window.location.hash))
  const mainRef = useRef<HTMLElement | null>(null)
  const isFirstRender = useRef(true)

  useEffect(() => {
    const onHashChange = () => {
      setRouteState(parseHash(window.location.hash))
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // Focus management + page title on navigation (not on initial load).
  useEffect(() => {
    document.title = TITLES[route.name]
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    mainRef.current?.focus({ preventScroll: false })
  }, [route])

  const setRoute = useCallback((next: Route) => {
    const hash = serializeRoute(next)
    if (window.location.hash !== hash) {
      window.location.hash = hash // triggers hashchange -> setRouteState
    } else {
      setRouteState(next)
    }
  }, [])

  const navigate = (id: string) => {
    if (
      id === 'home' ||
      id === 'new-decision' ||
      id === 'history' ||
      id === 'patterns'
    ) {
      setRoute({ name: id })
    }
  }

  const activeRouteId =
    route.name === 'edit-decision' ? 'new-decision' : route.name

  let screen: ReactNode
  switch (route.name) {
    case 'home':
      screen = (
        <HomeScreen
          onStart={() => setRoute({ name: 'new-decision' })}
          onEdit={(id) => setRoute({ name: 'edit-decision', id })}
        />
      )
      break
    case 'new-decision':
      screen = (
        <DecisionForm
          onSaved={(id) => setRoute({ name: 'edit-decision', id })}
          onCancel={() => setRoute({ name: 'home' })}
        />
      )
      break
    case 'edit-decision':
    case 'result': {
      const decision = decisions.find((d) => d.id === route.id)
      if (!decision) {
        screen = <NotFound onBack={() => setRoute({ name: 'home' })} />
        break
      }
      screen = (
        <div key={decision.id} className="animate-fade-up">
          {route.name === 'result' || decision.status === 'committed' ? (
            <ResultScreen decision={decision} onBack={() => setRoute({ name: 'home' })} />
          ) : (
            <DecisionWorkspace
              decision={decision}
              onSaved={() => setRoute({ name: 'result', id: decision.id })}
              onCancel={() => setRoute({ name: 'home' })}
            />
          )}
        </div>
      )
      break
    }
    case 'history':
      screen = <HistoryScreen onOpen={(id) => setRoute({ name: 'edit-decision', id })} />
      break
    case 'patterns':
      screen = <PatternsScreen />
      break
  }

  return (
    <AppShell navItems={NAV_ITEMS} activeRoute={activeRouteId} onNavigate={navigate} mainRef={mainRef}>
      {screen}
    </AppShell>
  )
}

function StorageErrorWatcher() {
  const { showToast } = useToast()

  useEffect(() => {
    const onStorageError = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail
      showToast({ message: detail ?? 'Changes could not be saved.' })
    }
    window.addEventListener('decision-desk:storage-error', onStorageError)
    return () =>
      window.removeEventListener('decision-desk:storage-error', onStorageError)
  }, [showToast])

  return null
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <DecisionStoreProvider>
          <StorageErrorWatcher />
          <AppRoutes />
        </DecisionStoreProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}

function NotFound({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <p className="text-sm font-medium tracking-widest text-slate-400 uppercase">
        Not found
      </p>
      <p className="max-w-sm text-slate-500">
        That decision doesn't exist (it may have been deleted).
      </p>
      <Button variant="secondary" onClick={onBack}>
        Back home
      </Button>
    </div>
  )
}
