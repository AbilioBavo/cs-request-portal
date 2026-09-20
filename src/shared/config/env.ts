import { z } from 'zod'

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().min(1).default('/api'),
  VITE_OIDC_AUTHORITY: z.string().default(''),
  VITE_OIDC_CLIENT_ID: z.string().default(''),
  VITE_OIDC_SCOPE: z.string().min(1).default('openid profile email'),
  VITE_ENABLE_API_MOCKS: z
    .string()
    .optional()
    .transform((value) => value === 'true'),
})

const parsed = envSchema.parse(import.meta.env)

export const env = {
  apiBaseUrl: parsed.VITE_API_BASE_URL,
  /** Vite injects the deploy sub-path here; the router uses it as basename. */
  basePath: import.meta.env.BASE_URL,
  enableApiMocks: parsed.VITE_ENABLE_API_MOCKS,
  oidc: {
    authority: parsed.VITE_OIDC_AUTHORITY,
    clientId: parsed.VITE_OIDC_CLIENT_ID,
    scope: parsed.VITE_OIDC_SCOPE,
  },
} as const

/**
 * The app boots without OIDC settings so that a misconfigured environment shows
 * an explanatory screen instead of a blank page or a redirect loop.
 */
export const isOidcConfigured = env.oidc.authority !== '' && env.oidc.clientId !== ''
