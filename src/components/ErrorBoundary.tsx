import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Last-resort error boundary around the whole app. Unexpected crashes show
 * a recovery screen instead of a blank page; local data is untouched, so a
 * reload after clearing transient state is always safe.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Decision Desk crashed:', error, info.componentStack)
  }

  private handleReload = (): void => {
    window.location.hash = '#/'
    window.location.reload()
  }

  render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-bold text-ink">Something went wrong</h1>
        <p className="text-sm text-ink-soft">
          An unexpected error occurred. Your decisions are saved locally and
          reloading is safe.
        </p>
        <pre className="max-h-32 max-w-full overflow-auto rounded-lg border border-hairline bg-surface p-3 text-left text-xs text-ink-soft">
          {error.message}
        </pre>
        <button
          type="button"
          onClick={this.handleReload}
          className="cursor-pointer rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#8b5cf6]"
        >
          Reload the app
        </button>
      </div>
    )
  }
}
