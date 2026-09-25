import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

interface AppShellProps<T extends string> {
  navItems: ReadonlyArray<{ id: T; label: string }>
  activeRoute: T
  onNavigate: (id: T) => void
  children: ReactNode
}

export function AppShell<T extends string>({
  navItems,
  activeRoute,
  onNavigate,
  children,
}: AppShellProps<T>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-4 py-3">
          <span className="shrink-0 text-sm font-semibold tracking-tight whitespace-nowrap text-emerald-400">
            Decision Desk
          </span>
          <nav aria-label="Primary" className="shrink-0">
            <ul className="flex items-center gap-1">
              {navItems.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onNavigate(item.id)}
                    aria-current={item.id === activeRoute ? 'page' : undefined}
                    className={cn(
                      'cursor-pointer rounded-md px-3 py-1.5 text-sm transition-colors',
                      item.id === activeRoute
                        ? 'bg-slate-800 font-medium text-slate-100'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200',
                    )}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        {children}
      </main>

      <footer className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        Decision Desk — think decisions through, step by step.
      </footer>
    </div>
  )
}
