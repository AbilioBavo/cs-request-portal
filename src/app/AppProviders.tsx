import { QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { AuthProvider } from 'react-oidc-context'

import { oidcConfig } from '../auth/oidc-config'
import { ToastProvider } from '../shared/toast/ToastProvider'
import { useToast } from '../shared/toast/toast-context'
import { ApiClientProvider } from './ApiClientProvider'
import { ErrorBoundary } from './ErrorBoundary'
import { createQueryClient } from './query-client'

function QueryProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast()

  const [queryClient] = useState(() =>
    createQueryClient({
      onBackgroundProblem: (problem) => {
        showToast({
          tone: 'error',
          title: problem.title,
          description: problem.detail,
          traceId: problem.traceId,
        })
      },
    }),
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider {...oidcConfig}>
          <QueryProvider>
            <ApiClientProvider>{children}</ApiClientProvider>
          </QueryProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}
