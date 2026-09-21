import { UserManager, WebStorageStateStore, type UserManagerSettings } from 'oidc-client-ts'

import { env, isOidcConfigured } from '../shared/config/env'

export const AUTH_CALLBACK_PATH = 'auth/callback'

function appUrl(path: string): string {
  return new URL(`${env.basePath}${path}`, window.location.origin).toString()
}

/*
 * Placeholders keep the manager constructible when no provider is configured.
 * RequireAuth shows a configuration screen in that case, so a sign-in is never
 * started and these values are never sent anywhere.
 */
const PLACEHOLDER_AUTHORITY = 'https://oidc-provider.not-configured.invalid'
const PLACEHOLDER_CLIENT_ID = 'not-configured'

const settings: UserManagerSettings = {
  authority: isOidcConfigured ? env.oidc.authority : PLACEHOLDER_AUTHORITY,
  client_id: isOidcConfigured ? env.oidc.clientId : PLACEHOLDER_CLIENT_ID,
  redirect_uri: appUrl(AUTH_CALLBACK_PATH),
  post_logout_redirect_uri: appUrl(''),
  scope: env.oidc.scope,

  /*
   * Authorization code flow with PKCE and no client secret, the only
   * appropriate grant for a browser application. oidc-client-ts derives the
   * S256 challenge, the state and the nonce by itself.
   */
  response_type: 'code',

  /*
   * Tokens live in sessionStorage: they survive a reload of the same tab and
   * disappear when it closes. An in-memory store would be stricter but would
   * force a silent renew through a third-party iframe on every reload, which
   * browsers increasingly block. The README documents the trade-off and the CSP
   * that limits the XSS surface.
   */
  userStore: new WebStorageStateStore({ store: window.sessionStorage }),
  stateStore: new WebStorageStateStore({ store: window.sessionStorage }),

  automaticSilentRenew: import.meta.env.VITE_DEMO_AUTH !== 'true',

  /*
   * Session monitoring polls the provider through a hidden iframe. It is the
   * usual cause of redirect loops behind reverse proxies and buys nothing for a
   * single-tab workflow.
   */
  monitorSession: false,
}

export const userManager = new UserManager(settings)

/**
 * The session store is the single source of truth for the bearer token, so the
 * API client reads it here instead of mirroring it in React state.
 */
export async function readAccessToken(): Promise<string | undefined> {
  const user = await userManager.getUser()
  return user?.access_token
}
