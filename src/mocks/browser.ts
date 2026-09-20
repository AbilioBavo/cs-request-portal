import { setupWorker } from 'msw/browser'

import { setMockLatency } from './config'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)

export async function startMockApi(): Promise<void> {
  setMockLatency(250)

  await worker.start({
    // Requests to the OIDC provider must reach the real provider.
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
    quiet: true,
  })
}
