import { vi } from 'vitest'
import type { AuthContextProps } from 'react-oidc-context'

/**
 * Single mutable seam for `useAuth`. Tests that care about a specific auth state
 * call `setAuth`; every other test gets a signed-in agent with both scopes.
 */
export const TEST_ACCESS_TOKEN = 'test-access-token'

function signedIn() {
  return {
    isAuthenticated: true,
    isLoading: false,
    activeNavigator: undefined,
    error: undefined,
    user: {
      access_token: TEST_ACCESS_TOKEN,
      scope: 'openid profile email service-requests.read service-requests.write',
      profile: { name: 'Ana Agent', email: 'agent@example.com' },
    },
    signinRedirect: vi.fn(),
    signoutRedirect: vi.fn(),
    signinSilent: vi.fn(),
  }
}

export const authMock = { value: signedIn() as unknown as AuthContextProps }

/**
 * Overrides merge into the signed-in default, and `user` merges field by field,
 * so a test can change one claim without rebuilding a whole session.
 */
export function setAuth({
  user,
  ...rest
}: Record<string, unknown> & { user?: Record<string, unknown> }): void {
  const base = signedIn()

  authMock.value = {
    ...base,
    ...rest,
    user: user === undefined ? base.user : { ...base.user, ...user },
  } as unknown as AuthContextProps
}

export function resetAuth(): void {
  authMock.value = signedIn() as unknown as AuthContextProps
}
