import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'

import { setAuth } from '../../test/auth-mock'
import { AuthCallbackPage } from './AuthCallbackPage'

function renderCallback() {
  return render(
    <MemoryRouter initialEntries={['/auth/callback']}>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/requests" element={<p>Requests list</p>} />
        <Route path="/requests/:requestId" element={<p>Request detail</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AuthCallbackPage', () => {
  it('returns the agent to the page that triggered the sign-in', async () => {
    setAuth({ user: { state: { returnTo: '/requests/req_42' } } })
    renderCallback()

    expect(await screen.findByText('Request detail')).toBeInTheDocument()
  })

  it('ignores an off-site destination so the callback cannot be used as an open redirect', async () => {
    setAuth({ user: { state: { returnTo: '//evil.example/steal' } } })
    renderCallback()

    expect(await screen.findByText('Requests list')).toBeInTheDocument()
  })

  it('falls back to the list when the provider returns no state', async () => {
    setAuth({ user: { state: undefined } })
    renderCallback()

    expect(await screen.findByText('Requests list')).toBeInTheDocument()
  })

  it('waits instead of navigating while the exchange is in flight', () => {
    setAuth({ isAuthenticated: false, isLoading: true })
    renderCallback()

    expect(screen.getAllByText('Completing sign-in')).toHaveLength(2)
  })

  it('reports a failed code exchange', () => {
    setAuth({ isAuthenticated: false, error: new Error('invalid_grant') })
    renderCallback()

    expect(
      screen.getByRole('heading', { name: 'Sign-in could not be completed' }),
    ).toBeInTheDocument()
  })
})
