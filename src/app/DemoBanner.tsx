import { env } from '../shared/config/env'

/**
 * States plainly which parts of the stack are simulated, so nobody mistakes the
 * demo deploy or a local run for a wiring to real services.
 */
export function DemoBanner() {
  const simulated = [
    env.enableApiMocks ? 'the Service Request API' : null,
    env.demoAuth ? 'sign-in' : null,
  ].filter((item): item is string => item !== null)

  if (simulated.length === 0) {
    return null
  }

  return (
    <p className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-900" role="status">
      Demo mode: {simulated.join(' and ')} {simulated.length > 1 ? 'are' : 'is'} mocked in the
      browser. Data resets on reload.
    </p>
  )
}
