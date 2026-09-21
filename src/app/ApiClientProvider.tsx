import { useQueryClient } from '@tanstack/react-query'
import { useMemo, type ReactNode } from 'react'
import { useAuth } from 'react-oidc-context'

import { ApiClientContext } from '../api/api-client-context'
import { createApiClient } from '../api/client'
import { recoverExpiredSession } from '../auth/session-recovery'
import { DEMO_ACCESS_TOKEN } from '../auth/demo-session'
import { readAccessToken } from '../auth/user-manager'
import { env } from '../shared/config/env'
import { useToast } from '../shared/toast/toast-context'

export function ApiClientProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const client = useMemo(() => {
    const onUnauthenticated = env.demoAuth
      ? undefined
      : () => {
          void recoverExpiredSession({
            auth,
            queryClient,
            onSessionLost: () => {
              showToast({
                tone: 'error',
                title: 'Your session expired',
                description: 'Sign in again to continue.',
              })
            },
          })
        }

    return createApiClient({
      baseUrl: env.apiBaseUrl,
      getAccessToken: env.demoAuth ? () => DEMO_ACCESS_TOKEN : readAccessToken,
      ...(onUnauthenticated === undefined ? {} : { onUnauthenticated }),
    })
  }, [auth, queryClient, showToast])

  return <ApiClientContext.Provider value={client}>{children}</ApiClientContext.Provider>
}
