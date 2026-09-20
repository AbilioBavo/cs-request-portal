import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderResult } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect, type ReactNode } from 'react'
import { MemoryRouter, Route, Routes, useLocation, type InitialEntry } from 'react-router'

import { ApiClientContext } from '../api/api-client-context'
import { createApiClient } from '../api/client'
import { ToastProvider } from '../shared/toast/ToastProvider'

/** jsdom does not resolve relative fetch URLs, so tests use an absolute base. */
export const TEST_API_BASE_URL = 'http://localhost/api'

function LocationReporter({ onChange }: { onChange: (url: string) => void }) {
  const location = useLocation()

  useEffect(() => {
    onChange(`${location.pathname}${location.search}`)
  }, [location, onChange])

  return null
}

export interface RenderRouteOptions {
  /** Route pattern, for example `/requests/:requestId`. */
  path: string
  /** Entry URL, for example `/requests?status=OPEN`. */
  initialEntry: string
  /** Navigation state, as carried by links between pages. */
  state?: unknown
}

export interface RenderRouteResult extends RenderResult {
  user: ReturnType<typeof userEvent.setup>
  /** Current location, so tests can assert on URL driven state. */
  currentUrl: () => string
}

export function renderRoute(
  element: ReactNode,
  { path, initialEntry, state }: RenderRouteOptions,
): RenderRouteResult {
  const user = userEvent.setup()
  const parsedEntry = new URL(initialEntry, 'http://localhost')
  const entry: InitialEntry =
    state === undefined
      ? initialEntry
      : { pathname: parsedEntry.pathname, search: parsedEntry.search, state }

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  const apiClient = createApiClient({
    baseUrl: TEST_API_BASE_URL,
    getAccessToken: () => 'test-access-token',
  })

  let currentUrl = initialEntry

  const view = render(
    <ToastProvider>
      <QueryClientProvider client={queryClient}>
        <ApiClientContext.Provider value={apiClient}>
          <MemoryRouter initialEntries={[entry]}>
            <LocationReporter
              onChange={(next) => {
                currentUrl = next
              }}
            />
            <Routes>
              <Route path={path} element={element} />
            </Routes>
          </MemoryRouter>
        </ApiClientContext.Provider>
      </QueryClientProvider>
    </ToastProvider>,
  )

  return { ...view, user, currentUrl: () => currentUrl }
}
