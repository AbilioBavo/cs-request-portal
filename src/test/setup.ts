import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'

import { server } from '../mocks/server'
import { resetStore } from '../mocks/store'
import { resetAuth } from './auth-mock'

vi.mock('react-oidc-context', async () => {
  const { authMock } = await import('./auth-mock')

  return {
    useAuth: () => authMock.value,
    AuthProvider: ({ children }: { children: unknown }) => children,
  }
})

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  server.resetHandlers()
  resetStore()
  resetAuth()
})

afterAll(() => {
  server.close()
})
