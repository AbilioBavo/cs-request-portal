import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'

import { AppProviders } from './app/AppProviders'
import { router } from './app/router'
import './index.css'
import { env } from './shared/config/env'

async function bootstrap(): Promise<void> {
  if (env.enableApiMocks) {
    const { startMockApi } = await import('./mocks/browser')
    await startMockApi()
  }

  const rootElement = document.getElementById('root')
  if (rootElement === null) {
    throw new Error('Cannot start the app: #root is missing from index.html')
  }

  createRoot(rootElement).render(
    <StrictMode>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </StrictMode>,
  )
}

void bootstrap()
