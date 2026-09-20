import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderRoute } from '../../../test/render'
import { RequestDetailPage } from './RequestDetailPage'

function renderDetail(requestId: string) {
  return renderRoute(<RequestDetailPage />, {
    path: '/requests/:requestId',
    initialEntry: `/requests/${requestId}`,
  })
}

describe('RequestDetailPage', () => {
  it('shows the stored request with its lifecycle data', async () => {
    renderDetail('REQ-1002')

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      'Duplicate invoice on February statement',
    )
    expect(screen.getByText('REQ-1002', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('In progress')).toBeInTheDocument()
    expect(screen.getByText('Medium')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'second.customer@example.com' })).toHaveAttribute(
      'href',
      'mailto:second.customer@example.com',
    )
  })

  it('explains a missing request instead of showing an error panel', async () => {
    renderDetail('REQ-9999')

    expect(await screen.findByText('Service request not found')).toBeInTheDocument()
    expect(screen.getByText('No service request exists with id REQ-9999.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to results' })).toHaveAttribute(
      'href',
      '/requests',
    )
  })

  it('returns to the list keeping the filters the user arrived with', async () => {
    renderRoute(<RequestDetailPage />, {
      path: '/requests/:requestId',
      initialEntry: '/requests/REQ-1001',
      state: { from: '?status=OPEN&page=2' },
    })

    expect(await screen.findByRole('link', { name: 'Back to results' })).toHaveAttribute(
      'href',
      '/requests?status=OPEN&page=2',
    )
  })
})
