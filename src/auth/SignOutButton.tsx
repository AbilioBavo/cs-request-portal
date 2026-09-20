import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from 'react-oidc-context'

import { Button } from '../shared/components/Button'

export function SignOutButton() {
  const auth = useAuth()
  const queryClient = useQueryClient()

  return (
    <Button
      variant="secondary"
      onClick={() => {
        // Drop cached service requests before leaving so the next user of this
        // browser cannot read them from memory.
        queryClient.clear()
        void auth.signoutRedirect()
      }}
    >
      Sign out
    </Button>
  )
}
