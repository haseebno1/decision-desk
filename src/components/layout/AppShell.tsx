import { useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'
import { currentTheme, setTheme, type Theme } from '@/lib/theme'
import {
  currentSidebar,
  setSidebar,
  type SidebarState,
} from '@/lib/sidebar'

export type NavIcon = 'home' | 'plus' | 'journal' | 'patterns' | 'settings'

export interface NavItem {
  id: string
  label: string
  icon: NavIcon
}

interface AppShellProps {
  navItems: ReadonlyArray<NavItem>
  activeRoute: string
  onNavigate: (id: string) => void
  /** Ref to <main> so the router can move focus on navigation. */
  mainRef?: React.Ref<HTMLElement>
  children: ReactNode
}

function NavGlyph({ icon, className }: { icon: NavIcon; className: string }) {
  switch (icon) {
    case 'home':
      return (
        <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
          <path
            d="M3.5 8.5 10 3l6.5 5.5V16a1 1 0 0 1-1 1h-4v-4.5h-3V17h-4a1 1 0 0 1-1-1V8.5Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'plus':
      return (
        <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
          <path d="M10 4.5v11M4.5 10h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )
    case 'journal':
      return (
        <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
          <path
            d="M5 3.5h8.5A1.5 1.5 0 0 1 15 5v10a1.5 1.5 0 0 1-1.5 1.5H5a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path d="M7 7h5M7 10h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      )
    case 'patterns':
      return (
        <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
          <circle cx="5" cy="14.5" r="1.8" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="10" cy="9" r="1.8" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="15" cy="4.5" r="1.8" stroke="currentColor" strokeWidth="1.4" />
          <path d="m6.4 13 2.2-2.5m1.9-1 2.6-2.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      )
    case 'settings':
      return (
        <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
          <circle cx="10" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.4" />
          <path
            d="M10 3.2v1.9m0 9.8v1.9M4.7 6.6l1.7 1m7.2 4.8 1.7 1M3.2 10h1.9m9.8 0h1.9M4.7 13.4l1.7-1m7.2-4.8 1.7-1"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
      )
  }
}

/**
 * Sun/moon theme switch. The pre-paint script in index.html has already
 * applied a theme, so state is read from the DOM rather than recomputed.
 */
function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  const isLight = theme === 'light'
  const label = isLight ? 'Switch to dark theme' : 'Switch to light theme'
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isLight}
      aria-label={label}
      title={label}
      className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-hairline bg-surface text-ink-soft transition-colors duration-150 hover:bg-surface-high hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:h-9 md:w-9"
    >
      <ThemeGlyph theme={theme} className="h-[18px] w-[18px]" />
    </button>
  )
}

function ThemeGlyph({ theme, className }: { theme: Theme; className: string }) {
  if (theme === 'light') {
    return (
      <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
        <circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth="1.4" />
        <path
          d="M10 2.7v1.7M10 15.6v1.7M2.7 10h1.7M15.6 10h1.7M4.9 4.9l1.2 1.2M13.9 13.9l1.2 1.2M15.1 4.9l-1.2 1.2M6.1 13.9l-1.2 1.2"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <path
        d="M16.3 12.3A6.5 6.5 0 0 1 7.7 3.7a6.8 6.8 0 1 0 8.6 8.6Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Desktop-only sidebar collapse. The collapsed state is applied by an
 * attribute on <html> (set pre-paint), so nothing about the layout waits on
 * React; this button only flips that attribute.
 */
function SidebarToggle({
  state,
  onToggle,
}: {
  state: SidebarState
  onToggle: () => void
}) {
  const collapsed = state === 'collapsed'
  const label = collapsed ? 'Show sidebar' : 'Hide sidebar'
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={collapsed}
      aria-label={label}
      title={label}
      className="hidden h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-hairline bg-surface text-ink-soft transition-colors duration-150 hover:bg-surface-high hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:flex"
    >
      <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]" aria-hidden>
        <rect
          x="2.6"
          y="3.4"
          width="14.8"
          height="13.2"
          rx="2.2"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <path d="M7.9 3.4v13.2" stroke="currentColor" strokeWidth="1.4" />
        {collapsed && (
          <path
            d="M11.4 8.2 13.9 10l-2.5 1.8"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </button>
  )
}

export function AppShell({ navItems, activeRoute, onNavigate, mainRef, children }: AppShellProps) {
  const primaryNav = navItems.filter((item) => item.icon !== 'settings')
  const settingsNav = navItems.filter((item) => item.icon === 'settings')
  const [theme, setThemeState] = useState<Theme>(() => currentTheme())
  const [sidebar, setSidebarState] = useState<SidebarState>(() => currentSidebar())

  const handleToggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setThemeState(next)
    setTheme(next)
  }

  const handleToggleSidebar = () => {
    const next: SidebarState = sidebar === 'expanded' ? 'collapsed' : 'expanded'
    setSidebarState(next)
    setSidebar(next)
  }

  const renderLink = (
    item: NavItem,
    variant: 'desktop' | 'mobile',
  ) => {
    const active = item.id === activeRoute
    const isPlus = item.icon === 'plus'
    if (variant === 'mobile' && isPlus) return null
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onNavigate(item.id)}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm transition-colors',
          active
            ? 'bg-surface-high font-semibold text-ink'
            : 'text-ink-soft hover:bg-surface-mid hover:text-ink',
        )}
      >
        <NavGlyph icon={item.icon} className="h-[18px] w-[18px] shrink-0" />
        <span className="ml-3">{item.label}</span>
      </button>
    )
  }

  return (
    <div className="min-h-dvh">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      {/* Ambient canvas glow — decorative only. */}
      <div
        aria-hidden
        className="pointer-events-none fixed top-[-20%] left-1/2 -z-10 h-[560px] w-[720px] -translate-x-1/2 rounded-full bg-accent-soft blur-[160px]"
      />

      {/* ── Desktop sidebar ─────────────────────────────────────────── */}
      <aside className="sidebar-rail fixed top-0 left-0 z-40 hidden h-full w-60 flex-col justify-between border-r border-hairline bg-canvas md:flex">
        <div className="flex flex-col">
          <div className="flex h-16 items-center gap-2 px-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15">
              <NavGlyph icon="journal" className="h-[18px] w-[18px] text-accent-text" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight text-ink">Decision Desk</span>
              <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-ink-soft uppercase">
                Calm Intelligence
              </span>
            </span>
          </div>

          <nav aria-label="Primary" className="px-3 py-2">
            <ul className="flex flex-col gap-0.5">
              {primaryNav.map((item) => (
                <li key={item.id}>{renderLink(item, 'desktop')}</li>
              ))}
            </ul>
          </nav>

          {settingsNav.length > 0 && (
            <>
              <div className="mx-5 my-2 h-px bg-hairline" aria-hidden />
              <nav aria-label="Secondary" className="px-3 pb-2">
                <ul className="flex flex-col gap-0.5">
                  {settingsNav.map((item) => (
                    <li key={item.id}>{renderLink(item, 'desktop')}</li>
                  ))}
                </ul>
              </nav>
            </>
          )}
        </div>

        <div className="p-3">
          <div className="flex items-center justify-between rounded-lg bg-surface px-3 py-2">
            <span className="flex items-center gap-2">
              <span aria-hidden className="h-2 w-2 rounded-full bg-accent shadow-marker" />
              <span className="font-mono text-[11px] font-medium text-ink-soft">Local data</span>
            </span>
            <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 text-ink-faint" aria-hidden>
              <rect x="3.5" y="7" width="9" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
              <path d="M5.5 7V5.5a2.5 2.5 0 0 1 5 0V7" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </div>
        </div>
      </aside>

      {/* ── Content column ─────────────────────────────────────────────
          Full-height flex column so <main> absorbs any spare space: on short
          pages the footer anchors to the viewport instead of floating with a
          viewport-sized gap beneath it. */}
      <div className="sidebar-offset flex min-h-dvh flex-col md:pl-60">
        {/* Desktop top bar */}
        <header className="sticky top-0 z-30 hidden h-16 items-center justify-between border-b border-hairline bg-canvas/85 px-8 backdrop-blur md:flex">
          <div aria-hidden className="font-mono text-[11px] tracking-[0.14em] text-ink-faint uppercase">
            Decide with clarity
          </div>
          <div className="flex items-center gap-2">
            <SidebarToggle state={sidebar} onToggle={handleToggleSidebar} />
            <ThemeToggle theme={theme} onToggle={handleToggleTheme} />
            <button
              type="button"
              onClick={() => onNavigate('new-decision')}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-white shadow-glow transition-[background-color,box-shadow] duration-150 hover:bg-accent-bright hover:shadow-glow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <NavGlyph icon="plus" className="h-4 w-4" />
              New decision
            </button>
          </div>
        </header>

        {/* Mobile top bar.
            Opaque on purpose: a translucent sticky bar needs backdrop-filter,
            and in embedded WebViews that combo can stop repainting mid-scroll
            — the bar then disappears entirely while scrolling. */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-hairline bg-canvas px-4 md:hidden">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/15">
              <NavGlyph icon="journal" className="h-4 w-4 text-accent-text" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-mono text-[11px] font-semibold tracking-[0.12em] text-accent-text">DFK</span>
              <span className="mt-0.5 font-mono text-[9px] font-semibold tracking-[0.12em] text-ink-soft uppercase">
                Calm Intelligence
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-surface-high px-2.5 py-1">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="font-mono text-[9px] font-semibold tracking-[0.12em] text-ink-soft uppercase">
                Local vault
              </span>
            </div>
            <ThemeToggle theme={theme} onToggle={handleToggleTheme} />
          </div>
        </header>

        <main
          id="main-content"
          ref={mainRef}
          tabIndex={-1}
          className="mx-auto w-full max-w-3xl flex-1 px-4 pt-6 pb-28 outline-none md:max-w-4xl md:px-8 md:pt-10 md:pb-16"
        >
          {children}
        </main>

        {/* Footer carries the tagline and the author credit. Shown on mobile
            too (padded clear of the bottom nav) so the credit is never
            desktop-only. */}
        <footer className="px-4 pt-6 pb-24 md:px-8 md:pb-6">
          <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center font-mono text-[11px] text-ink-faint md:justify-start md:text-left">
            <span>Decision Desk — think decisions through, step by step.</span>
            <span aria-hidden className="hidden md:inline">
              ·
            </span>
            <span>
              Built by{' '}
              <a
                href="https://github.com/haseebno1"
                target="_blank"
                rel="noreferrer noopener"
                className="text-ink-soft underline decoration-hairline-strong underline-offset-2 transition-colors hover:text-accent-text hover:decoration-accent"
              >
                Abdul Haseeb
              </a>
            </span>
          </p>
        </footer>
      </div>

      {/* ── Mobile bottom nav ───────────────────────────────────────── */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-canvas pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="flex h-16 items-center justify-around px-2">
          {navItems.map((item) => {
            const active = item.id === activeRoute
            const isPlus = item.icon === 'plus'
            if (isPlus) {
              return (
                <li key={item.id} className="-mt-6">
                  <button
                    type="button"
                    onClick={() => onNavigate(item.id)}
                    className="group flex cursor-pointer flex-col items-center gap-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-white shadow-glow transition-transform duration-200 group-active:scale-95">
                      <NavGlyph icon="plus" className="h-5 w-5" />
                    </span>
                    <span className="font-mono text-[9px] font-semibold tracking-wider text-ink-soft uppercase">
                      Decide
                    </span>
                  </button>
                </li>
              )
            }
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex w-16 cursor-pointer flex-col items-center gap-1 py-2 transition-colors',
                    active ? 'text-accent-text' : 'text-ink-soft hover:text-ink',
                  )}
                >
                  <NavGlyph icon={item.icon} className="h-5 w-5" />
                  <span className="font-mono text-[9px] font-semibold tracking-wider uppercase">
                    {item.label}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
