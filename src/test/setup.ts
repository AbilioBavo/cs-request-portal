import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'

import { server } from '../mocks/server'
import { resetStore } from '../mocks/store'

vi.mock('react-oidc-context', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    error: undefined,
    user: {
      access_token: 'test-access-token',
      scope: 'openid profile email service-requests.read service-requests.write',
      profile: { name: 'Ana Agent', email: 'agent@example.com' },
    },
    signinRedirect: vi.fn(),
    signoutRedirect: vi.fn(),
    signinSilent: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: unknown }) => children,
}))

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  server.resetHandlers()
  resetStore()
})

afterAll(() => {
  server.close()
})
