import type { QueryClient } from '@tanstack/react-query'
import type { AuthContextProps } from 'react-oidc-context'

/** Guards against a burst of parallel 401s starting several recoveries. */
let recovering = false

export interface RecoverSessionDeps {
  auth: AuthContextProps
  queryClient: QueryClient
  onSessionLost: () => void
}

/**
 * A 401 is first treated as an expired access token: try a silent renew and
 * replay the affected queries. Only if that fails does the user go back to the
 * provider, keeping the current location so they return to where they were.
 */
export async function recoverExpiredSession({
  auth,
  queryClient,
  onSessionLost,
}: RecoverSessionDeps): Promise<void> {
  if (recovering) {
    return
  }
  recovering = true

  try {
    const user = await auth.signinSilent()
    if (user === null) {
      throw new Error('The provider returned no session')
    }
    await queryClient.invalidateQueries()
  } catch {
    onSessionLost()
    await auth.signinRedirect({
      state: { returnTo: `${window.location.pathname}${window.location.search}` },
    })
  } finally {
    recovering = false
  }
}
