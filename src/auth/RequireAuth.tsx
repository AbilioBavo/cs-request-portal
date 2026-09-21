import { useEffect, useRef, type ReactNode } from 'react'
import { useAuth } from 'react-oidc-context'
import { useLocation } from 'react-router'

import { ConfigurationRequired } from '../app/pages/ConfigurationRequired'
import { ErrorState } from '../shared/components/ErrorState'
import { FullPageStatus } from '../shared/components/FullPageStatus'
import { isOidcConfigured, env } from '../shared/config/env'

export function RequireAuth({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const location = useLocation()
  const redirectStarted = useRef(false)

  /** Where to land once the provider redirects back. */
  const returnTo = `${location.pathname}${location.search}`

  useEffect(() => {
    if (env.e2eAuth || !isOidcConfigured || redirectStarted.current) {
      return
    }

    const busy = auth.isLoading || auth.activeNavigator !== undefined
    if (busy || auth.isAuthenticated || auth.error !== undefined) {
      return
    }

    redirectStarted.current = true
    void auth.signinRedirect({ state: { returnTo } })
  }, [auth, returnTo])

  if (env.e2eAuth) {
    return children
  }

  if (!isOidcConfigured) {
    return <ConfigurationRequired />
  }

  if (auth.error !== undefined) {
    return (
      <div className="mx-auto max-w-2xl">
        <ErrorState
          title="Sign-in failed"
          error={auth.error}
          onRetry={() => {
            redirectStarted.current = true
            void auth.signinRedirect({ state: { returnTo } })
          }}
        />
        <p className="mt-4 text-sm text-ink-muted">
          If the problem persists, confirm that the OIDC provider is running and that this origin is
          registered as a valid redirect URI.
        </p>
      </div>
    )
  }

  if (!auth.isAuthenticated) {
    return <FullPageStatus label="Signing you in" />
  }

  return children
}
