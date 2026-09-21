import { QueryClient } from '@tanstack/react-query'
import type { AuthContextProps } from 'react-oidc-context'
import { describe, expect, it, vi } from 'vitest'

import { recoverExpiredSession } from './session-recovery'

function setup(signinSilent: () => Promise<unknown>) {
  const auth = {
    signinSilent: vi.fn(signinSilent),
    signinRedirect: vi.fn(() => Promise.resolve()),
  } as unknown as AuthContextProps

  const queryClient = new QueryClient()
  const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')
  const onSessionLost = vi.fn()

  return { auth, queryClient, invalidateQueries, onSessionLost }
}

describe('recoverExpiredSession', () => {
  it('renews silently and replays the queries without disturbing the user', async () => {
    const { auth, queryClient, invalidateQueries, onSessionLost } = setup(() =>
      Promise.resolve({ access_token: 'fresh' }),
    )

    await recoverExpiredSession({ auth, queryClient, onSessionLost })

    expect(invalidateQueries).toHaveBeenCalledTimes(1)
    expect(onSessionLost).not.toHaveBeenCalled()
    expect(auth.signinRedirect).not.toHaveBeenCalled()
  })

  it('falls back to the provider when the silent renew fails', async () => {
    const { auth, queryClient, onSessionLost } = setup(() =>
      Promise.reject(new Error('login_required')),
    )
    window.history.replaceState({}, '', '/requests?status=NEW')

    await recoverExpiredSession({ auth, queryClient, onSessionLost })

    expect(onSessionLost).toHaveBeenCalledTimes(1)
    expect(auth.signinRedirect).toHaveBeenCalledWith({
      state: { returnTo: '/requests?status=NEW' },
    })
  })

  it('treats a missing session from a resolved renew as a lost session', async () => {
    const { auth, queryClient, onSessionLost } = setup(() => Promise.resolve(null))

    await recoverExpiredSession({ auth, queryClient, onSessionLost })

    expect(onSessionLost).toHaveBeenCalledTimes(1)
    expect(auth.signinRedirect).toHaveBeenCalledTimes(1)
  })

  it('collapses a burst of parallel failures into a single recovery', async () => {
    let release: (value: unknown) => void = () => undefined
    const pending = new Promise((resolve) => {
      release = resolve
    })
    const { auth, queryClient, onSessionLost } = setup(async () => {
      await pending
      return { access_token: 'fresh' }
    })

    const first = recoverExpiredSession({ auth, queryClient, onSessionLost })
    const second = recoverExpiredSession({ auth, queryClient, onSessionLost })
    release(undefined)
    await Promise.all([first, second])

    expect(auth.signinSilent).toHaveBeenCalledTimes(1)
  })
})
