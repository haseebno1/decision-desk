import { createContext, useContext } from 'react'
import type { Toast } from './ToastContext'

export interface ToastStore {
  showToast: (toast: Omit<Toast, 'id'>) => void
}

export const ToastContext = createContext<ToastStore | null>(null)

export function useToast(): ToastStore {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return ctx
}
