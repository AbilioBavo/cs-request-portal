import { useEffect } from 'react'
import { useAuth } from 'react-oidc-context'
import { useNavigate } from 'react-router'

import { ErrorState } from '../../shared/components/ErrorState'
import { FullPageStatus } from '../../shared/components/FullPageStatus'

const DEFAULT_DESTINATION = '/requests'

/**
 * Only in-app paths are accepted so a tampered `state` cannot turn the callback
 * into an open redirect.
 */
function readReturnTo(state: unknown): string {
  if (typeof state !== 'object' || state === null || !('returnTo' in state)) {
    return DEFAULT_DESTINATION
  }

  const { returnTo: value } = state
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) {
    return DEFAULT_DESTINATION
  }

  return value
}

export function AuthCallbackPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const returnTo = readReturnTo(auth.user?.state)

  useEffect(() => {
    if (auth.isLoading || auth.error !== undefined || !auth.isAuthenticated) {
      return
    }

    void navigate(returnTo, { replace: true })
  }, [auth.isLoading, auth.error, auth.isAuthenticated, navigate, returnTo])

  if (auth.error !== undefined) {
    return (
      <div className="mx-auto max-w-2xl">
        <ErrorState title="Sign-in could not be completed" error={auth.error} />
      </div>
    )
  }

  return <FullPageStatus label="Completing sign-in" />
}
