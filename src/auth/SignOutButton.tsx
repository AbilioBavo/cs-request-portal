import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from 'react-oidc-context'

import { Button } from '../shared/components/Button'
import { env } from '../shared/config/env'

export function SignOutButton() {
  const auth = useAuth()
  const queryClient = useQueryClient()

  return (
    <Button
      variant="secondary"
      onClick={() => {
        queryClient.clear()
        if (!env.demoAuth) {
          void auth.signoutRedirect()
        }
      }}
    >
      Sign out
    </Button>
  )
}
