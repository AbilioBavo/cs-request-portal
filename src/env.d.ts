/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the Service Request API. The contract ships no `servers` block, so `/api` is assumed. */
  readonly VITE_API_BASE_URL: string
  /** OIDC issuer, e.g. http://localhost:8080/realms/service-requests */
  readonly VITE_OIDC_AUTHORITY: string
  /** Public client id registered in the OIDC provider */
  readonly VITE_OIDC_CLIENT_ID: string
  /** Space separated scopes requested at sign-in */
  readonly VITE_OIDC_SCOPE: string
  /** Set to "true" to start the MSW worker in the browser */
  readonly VITE_ENABLE_API_MOCKS: string
  /** Set to "true" in Playwright to skip the real OIDC provider */
  readonly VITE_DEMO_AUTH: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
