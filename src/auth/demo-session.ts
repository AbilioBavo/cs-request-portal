/**
 * Fixed session used when the app runs in demo mode: the Playwright suite and
 * the public Pages build, neither of which can reach a Keycloak instance.
 */
export const DEMO_ACCESS_TOKEN = 'demo-access-token'

export const DEMO_SESSION = {
  isAuthenticated: true,
  displayName: 'Ana Agent',
  email: 'agent@example.com',
  canUpdateStatus: true,
} as const
