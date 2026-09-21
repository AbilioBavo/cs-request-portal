import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const envMock = { enableApiMocks: false, demoAuth: false }

vi.mock('../shared/config/env', () => ({ env: envMock }))

const { DemoBanner } = await import('./DemoBanner')

describe('DemoBanner', () => {
  it('stays out of the way when the app talks to real services', () => {
    envMock.enableApiMocks = false
    envMock.demoAuth = false

    render(<DemoBanner />)

    expect(screen.queryByTestId('demo-banner')).not.toBeInTheDocument()
  })

  it('names the API as mocked when only the backend is simulated', () => {
    envMock.enableApiMocks = true
    envMock.demoAuth = false

    render(<DemoBanner />)

    expect(screen.getByTestId('demo-banner')).toHaveTextContent(
      'Demo mode: the Service Request API is mocked in the browser.',
    )
  })

  it('names both when sign-in is simulated as well', () => {
    envMock.enableApiMocks = true
    envMock.demoAuth = true

    render(<DemoBanner />)

    expect(screen.getByTestId('demo-banner')).toHaveTextContent(
      'the Service Request API and sign-in are mocked',
    )
  })
})
