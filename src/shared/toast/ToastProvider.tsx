import { useCallback, useMemo, useState, type ReactNode } from 'react'

import { ToastContext, type Toast, type ToastInput } from './toast-context'

const AUTO_DISMISS_MS: Record<Toast['tone'], number> = {
  success: 5000,
  info: 6000,
  // Failures stay until dismissed: the user may need to copy the trace id.
  error: Number.POSITIVE_INFINITY,
}

const MAX_VISIBLE = 3

const TONE_STYLES: Record<Toast['tone'], string> = {
  success: 'border-success bg-success-surface text-success',
  error: 'border-danger bg-danger-surface text-danger',
  info: 'border-info bg-info-surface text-info',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (input: ToastInput) => {
      const toast: Toast = { ...input, id: crypto.randomUUID(), tone: input.tone ?? 'info' }
      setToasts((current) => [...current.slice(-(MAX_VISIBLE - 1)), toast])

      const timeout = AUTO_DISMISS_MS[toast.tone]
      if (Number.isFinite(timeout)) {
        window.setTimeout(() => {
          dismissToast(toast.id)
        }, timeout)
      }
    },
    [dismissToast],
  )

  const api = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:items-end"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto w-full max-w-sm rounded-md border-l-4 bg-surface p-4 shadow-lg ${TONE_STYLES[toast.tone]}`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium">{toast.title}</p>
              <button
                type="button"
                onClick={() => {
                  dismissToast(toast.id)
                }}
                className="text-ink-muted hover:text-ink"
              >
                <span aria-hidden="true">&times;</span>
                <span className="sr-only">Dismiss notification</span>
              </button>
            </div>

            {toast.description !== undefined && (
              <p className="mt-1 text-sm text-ink">{toast.description}</p>
            )}

            {toast.action !== undefined && (
              <button
                type="button"
                onClick={() => {
                  toast.action?.onAction()
                  dismissToast(toast.id)
                }}
                className="mt-2 text-sm font-medium underline underline-offset-2"
              >
                {toast.action.label}
              </button>
            )}

            {toast.traceId !== undefined && (
              <p className="mt-2 font-mono text-xs text-ink-muted">Trace {toast.traceId}</p>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
