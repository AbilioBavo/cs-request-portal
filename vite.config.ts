import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { loadEnv, type Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

/** Opt-in that a build with authentication disabled is intentional. */
const DEMO_AUTH_ACK = 'ALLOW_DEMO_AUTH_BUILD'

function originOf(value: string | undefined): string | undefined {
  if (value === undefined || value === '') {
    return undefined
  }

  try {
    return new URL(value).origin
  } catch {
    // A relative base URL such as /api is same-origin, so 'self' already covers it.
    return undefined
  }
}

/**
 * Static hosting cannot send headers, so the policy travels in the document.
 * Build only: the dev server needs eval for hot module replacement, and a policy
 * that has to be relaxed for development is not the policy worth shipping.
 */
function contentSecurityPolicy(env: Record<string, string>): Plugin {
  const issuer = originOf(env.VITE_OIDC_AUTHORITY)
  const api = originOf(env.VITE_API_BASE_URL)

  const directives = [
    "default-src 'self'",
    "script-src 'self'",
    // Radix and React write style attributes; nothing injects stylesheets.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    // The service worker that serves the mocked API.
    "worker-src 'self'",
    // The silent renew iframe points at the provider.
    `frame-src 'self'${issuer === undefined ? '' : ` ${issuer}`}`,
    `connect-src 'self'${[issuer, api]
      .filter((origin): origin is string => origin !== undefined)
      .map((origin) => ` ${origin}`)
      .join('')}`,
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
  ]

  return {
    name: 'inject-csp-meta',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler: (html) => ({
        html,
        tags: [
          {
            tag: 'meta',
            attrs: {
              'http-equiv': 'Content-Security-Policy',
              content: directives.join('; '),
            },
            injectTo: 'head-prepend',
          },
        ],
      }),
    },
  }
}

/**
 * Demo mode hands out a session without asking anyone to sign in. Two builds
 * legitimately want that, Playwright and the public demo, and both say so; any
 * other production build that enables it is a mistake worth stopping.
 */
function assertDemoAuthIsDeliberate(env: Record<string, string>): void {
  if (env.VITE_DEMO_AUTH === 'true' && process.env[DEMO_AUTH_ACK] !== 'true') {
    throw new Error(
      `VITE_DEMO_AUTH=true disables authentication. Set ${DEMO_AUTH_ACK}=true to build the demo on purpose, or unset VITE_DEMO_AUTH.`,
    )
  }
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  if (command === 'build' && mode === 'production') {
    assertDemoAuthIsDeliberate(env)
  }

  return {
    // GitHub Pages serves the app from a repository sub-path, so the base has to
    // be injected at build time instead of being hardcoded.
    base: process.env.VITE_BASE_PATH ?? '/',
    plugins: [react(), tailwindcss(), contentSecurityPolicy(env)],
    build: {
      sourcemap: true,
      // The polyfill is an inline script, which would force 'unsafe-inline' on
      // script-src. Browsers without modulepreload just skip the hint.
      modulePreload: { polyfill: false },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      restoreMocks: true,
      globals: true,
      // Form tests drive real keystrokes through jsdom; under coverage and
      // parallel workers the default 5s is not enough headroom on slower CI boxes.
      testTimeout: 20_000,
      exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
      coverage: {
        provider: 'v8',
        reporter: ['text-summary', 'lcov'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'src/**/*.d.ts',
          'src/main.tsx',
          'src/mocks/**',
          'src/test/**',
          'src/**/index.ts',
        ],
        thresholds: {
          lines: 80,
          statements: 80,
          functions: 80,
          branches: 70,
          'src/api/**': { lines: 90, statements: 90, functions: 90, branches: 80 },
          'src/features/requests/**': { lines: 90, statements: 90, functions: 85, branches: 80 },
        },
      },
    },
  }
})
