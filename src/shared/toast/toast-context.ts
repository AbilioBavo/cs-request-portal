import { createContext, useContext } from 'react'

export type ToastTone = 'success' | 'error' | 'info'

export interface ToastAction {
  label: string
  onAction: () => void
}

export interface ToastInput {
  title: string
  description?: string | undefined
  tone?: ToastTone | undefined
  /** Correlation id from a problem document, shown so it can be quoted in support. */
  traceId?: string | undefined
  action?: ToastAction | undefined
}

export interface Toast extends ToastInput {
  id: string
  tone: ToastTone
}

export interface ToastApi {
  showToast: (toast: ToastInput) => void
  dismissToast: (id: string) => void
}

export const ToastContext = createContext<ToastApi | null>(null)

export function useToast(): ToastApi {
  const api = useContext(ToastContext)

  if (api === null) {
    throw new Error('useToast must be used inside a ToastProvider')
  }

  return api
}
