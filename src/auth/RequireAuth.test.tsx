import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import { authMock, setAuth } from '../test/auth-mock'

const envMock = {
  apiBaseUrl: '/api',
  basePath: '/',
  enableApiMocks: false,
  demoAuth: false,
  oidc: { authority: 'https://idp.test/realms/demo', clientId: 'portal', scope: 'openid' },
}

let oidcConfigured = true

vi.mock('../shared/config/env', () => ({
  env: envMock,
  get isOidcConfigured() {
    return oidcConfigured
  },
}))

const { RequireAuth } = await import('./RequireAuth')

function renderGuard(path = '/requests?status=NEW') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <RequireAuth>
        <p>Protected content</p>
      </RequireAuth>
    </MemoryRouter>,
  )
}

describe('RequireAuth', () => {
  beforeEach(() => {
    oidcConfigured = true
    envMock.demoAuth = false
  })

  it('renders the protected content for a signed-in agent', () => {
    renderGuard()

    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })

  it('sends an anonymous visitor to the provider and remembers where to return', async () => {
    setAuth({ isAuthenticated: false })
    renderGuard('/requests/req_1?from=list')

    // Announced to screen readers and shown as text, hence two nodes.
    expect(screen.getAllByText('Signing you in')).toHaveLength(2)
    await vi.waitFor(() => {
      expect(authMock.value.signinRedirect).toHaveBeenCalledWith({
        state: { returnTo: '/requests/req_1?from=list' },
      })
    })
  })

  it('does not redirect while the provider is still resolving the session', () => {
    setAuth({ isAuthenticated: false, isLoading: true })
    renderGuard()

    expect(authMock.value.signinRedirect).not.toHaveBeenCalled()
  })

  it('explains a failed sign-in and allows another attempt', async () => {
    setAuth({ isAuthenticated: false, error: new Error('Provider unreachable') })
    renderGuard()

    expect(screen.getByRole('heading', { name: 'Sign-in failed' })).toBeInTheDocument()
    expect(authMock.value.signinRedirect).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(authMock.value.signinRedirect).toHaveBeenCalledTimes(1)
  })

  it('asks for configuration instead of looping when the provider is unset', () => {
    oidcConfigured = false
    setAuth({ isAuthenticated: false })
    renderGuard()

    expect(
      screen.getByRole('heading', { name: 'Authentication is not configured' }),
    ).toBeInTheDocument()
    expect(authMock.value.signinRedirect).not.toHaveBeenCalled()
  })

  it('skips the provider entirely in demo mode', () => {
    envMock.demoAuth = true
    setAuth({ isAuthenticated: false })
    renderGuard()

    expect(screen.getByText('Protected content')).toBeInTheDocument()
    expect(authMock.value.signinRedirect).not.toHaveBeenCalled()
  })
})
