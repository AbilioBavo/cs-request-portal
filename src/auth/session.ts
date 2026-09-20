import { useAuth } from 'react-oidc-context'

export const READ_SCOPE = 'service-requests.read'
export const WRITE_SCOPE = 'service-requests.write'

export interface AuthSession {
  isAuthenticated: boolean
  displayName: string
  email: string | undefined
  /** False only when the provider states that the write scope was not granted. */
  canUpdateStatus: boolean
}

export function useAuthSession(): AuthSession {
  const { isAuthenticated, user } = useAuth()
  const grantedScopes = user?.scope?.split(' ') ?? null

  return {
    isAuthenticated,
    displayName:
      user?.profile.name ?? user?.profile.preferred_username ?? user?.profile.email ?? 'Signed in',
    email: user?.profile.email,
    /*
     * A provider that does not report granted scopes is not evidence of a
     * missing permission, so the control stays enabled and a 403 from the API is
     * handled where the action happens.
     */
    canUpdateStatus: grantedScopes === null || grantedScopes.includes(WRITE_SCOPE),
  }
}
