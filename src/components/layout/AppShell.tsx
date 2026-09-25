import type { RefObject, ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

interface AppShellProps<T extends string> {
  navItems: ReadonlyArray<{ id: T; label: string }>
  activeRoute: T
  onNavigate: (id: T) => void
  /** Ref to <main> so the router can move focus on navigation. */
  mainRef?: RefObject<HTMLElement | null>
  children: ReactNode
}

export function AppShell<T extends string>({
  navItems,
  activeRoute,
  onNavigate,
  mainRef,
  children,
}: AppShellProps<T>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
          <span className="shrink-0 text-sm font-semibold tracking-tight whitespace-nowrap text-emerald-400">
            Decision Desk
          </span>
          <nav aria-label="Primary">
            <ul className="flex flex-wrap items-center gap-1">
              {navItems.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onNavigate(item.id)}
                    aria-current={item.id === activeRoute ? 'page' : undefined}
                    className={cn(
                      'cursor-pointer rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-slate-800/60 hover:text-slate-200',
                      item.id === activeRoute
                        ? 'bg-slate-800 font-medium text-slate-100'
                        : 'text-slate-400',
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

      <main
        id="main-content"
        ref={mainRef}
        tabIndex={-1}
        className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 outline-none"
      >
        {children}
      </main>

      <footer className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        Decision Desk — think decisions through, step by step.
      </footer>
    </div>
  )
}
