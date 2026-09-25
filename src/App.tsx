import { useState, type ReactNode } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { HomeScreen } from '@/features/home/HomeScreen'
import { DecisionForm } from '@/features/decisions/DecisionForm'
import { DecisionStoreProvider } from '@/features/decisions/DecisionStoreContext'
import { useDecisions } from '@/features/decisions/decisionStore'
import { DecisionWorkspace } from '@/features/decisions/DecisionWorkspace'
import { ResultScreen } from '@/features/decisions/ResultScreen'
import { HistoryScreen } from '@/features/history/HistoryScreen'

type Route =
  | { name: 'home' }
  | { name: 'new-decision' }
  | { name: 'edit-decision'; id: string }
  | { name: 'result'; id: string }
  | { name: 'history' }
  | { name: 'patterns' }

const NAV_ITEMS: ReadonlyArray<{ id: string; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'new-decision', label: 'New decision' },
  { id: 'history', label: 'History' },
  { id: 'patterns', label: 'Patterns' },
]

function AppRoutes() {
  const [route, setRoute] = useState<Route>({ name: 'home' })
  const { decisions } = useDecisions()

  const navigate = (id: string) => {
    if (id === 'home') setRoute({ name: 'home' })
    else if (id === 'new-decision') setRoute({ name: 'new-decision' })
    else if (id === 'history') setRoute({ name: 'history' })
    else if (id === 'patterns') setRoute({ name: 'patterns' })
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
      screen =
        route.name === 'result' || decision.status === 'committed' ? (
          <ResultScreen decision={decision} onBack={() => setRoute({ name: 'home' })} />
        ) : (
          <DecisionWorkspace
            decision={decision}
            onSaved={() => setRoute({ name: 'result', id: decision.id })}
            onCancel={() => setRoute({ name: 'home' })}
          />
        )
      break
    }
    case 'history':
      screen = <HistoryScreen onOpen={(id) => setRoute({ name: 'edit-decision', id })} />
      break
    case 'patterns':
      screen = <PlaceholderScreen label="Patterns" />
      break
  }

  return (
    <AppShell navItems={NAV_ITEMS} activeRoute={activeRouteId} onNavigate={navigate}>
      {screen}
    </AppShell>
  )
}

export default function App() {
  return (
    <DecisionStoreProvider>
      <AppRoutes />
    </DecisionStoreProvider>
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

function PlaceholderScreen({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <p className="text-sm font-medium tracking-widest text-slate-400 uppercase">
        {label}
      </p>
      <p className="max-w-sm text-slate-500">
        Coming in a later phase of the implementation plan.
      </p>
    </div>
  )
}
