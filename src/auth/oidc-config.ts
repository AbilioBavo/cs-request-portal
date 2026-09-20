import type { AuthProviderProps } from 'react-oidc-context'

import { userManager } from './user-manager'

export const oidcConfig: AuthProviderProps = {
  userManager,
  onSigninCallback: () => {
    // Drop `code` and `state` from the address bar once they are consumed.
    window.history.replaceState({}, document.title, window.location.pathname)
  },
}
