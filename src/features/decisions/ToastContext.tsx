import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { ToastContext, type ToastStore } from './toastStore'

export interface Toast {
  id: number
  message: string
  actionLabel?: string
  onAction?: () => void
}

const TOAST_TIMEOUT_MS = 6000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback<ToastStore['showToast']>(
    (toast) => {
      const id = nextId.current++
      setToasts((prev) => [...prev.slice(-2), { ...toast, id }])
      window.setTimeout(() => dismiss(id), TOAST_TIMEOUT_MS)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Sits above the mobile bottom nav (56px + safe area) so a toast never
          buries the navigation, then returns to the corner on desktop. */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex flex-col items-center gap-2 px-4 md:bottom-4"
      >
        {toasts.map((toast) => (          <div
            key={toast.id}
            className="animate-fade-up pointer-events-auto flex items-center gap-4 rounded-xl border border-hairline bg-surface-low px-4 py-3 shadow-float backdrop-blur"
          >
            <p className="text-sm text-ink">{toast.message}</p>
            {toast.actionLabel && toast.onAction && (
              <button
                type="button"
                onClick={() => {
                  toast.onAction?.()
                  dismiss(toast.id)
                }}
                className="cursor-pointer text-sm font-semibold text-accent-text transition-colors hover:text-ink"
              >
                {toast.actionLabel}
              </button>
            )}
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => dismiss(toast.id)}
              className="cursor-pointer text-ink-faint transition-colors hover:text-ink"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
