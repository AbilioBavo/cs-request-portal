import { screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '../../../mocks/server'
import { renderRoute } from '../../../test/render'
import { RequestDetailPage } from '../pages/RequestDetailPage'

function renderDetail(requestId: string) {
  return renderRoute(<RequestDetailPage />, {
    path: '/requests/:requestId',
    initialEntry: `/requests/${requestId}`,
  })
}

describe('status transitions', () => {
  it('offers only the legal next statuses for an open request', async () => {
    renderDetail('REQ-1001')

    const select = await screen.findByLabelText('Move to')
    expect(screen.getAllByRole('option').map((option) => option.getAttribute('value'))).toEqual([
      '',
      'IN_PROGRESS',
      'CLOSED',
    ])
    expect(select).toBeEnabled()
  })

  it('explains that a closed request cannot be changed', async () => {
    renderDetail('REQ-1006')

    expect(await screen.findByText(/Closed is a terminal state/i)).toBeInTheDocument()
    expect(screen.queryByLabelText('Move to')).not.toBeInTheDocument()
  })

  it('applies an allowed transition', async () => {
    const { user } = renderDetail('REQ-1001')

    await user.selectOptions(await screen.findByLabelText('Move to'), 'IN_PROGRESS')
    await user.click(screen.getByRole('button', { name: 'Update status' }))
    await user.click(await screen.findByRole('button', { name: 'Confirm' }))

    expect(await screen.findByText(/is now In progress/i)).toBeInTheDocument()
  })

  it('opens the conflict dialog when the version is stale', async () => {
    server.use(
      http.patch('*/requests/:requestId/status', () =>
        HttpResponse.json(
          {
            type: 'https://api.example.test/problems/version-conflict',
            title: 'Update conflict',
            status: 409,
            detail: 'The request was updated by someone else. Refresh and try again.',
          },
          { status: 409, headers: { 'content-type': 'application/problem+json' } },
        ),
      ),
    )

    const { user } = renderDetail('REQ-1001')

    await user.selectOptions(await screen.findByLabelText('Move to'), 'IN_PROGRESS')
    await user.click(screen.getByRole('button', { name: 'Update status' }))
    await user.click(await screen.findByRole('button', { name: 'Confirm' }))

    expect(await screen.findByText('This request was updated by someone else')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry with latest version' })).toBeInTheDocument()
  })

  it('shows the server message for a forbidden transition', async () => {
    server.use(
      http.patch('*/requests/:requestId/status', () =>
        HttpResponse.json(
          {
            title: 'Invalid status transition',
            status: 422,
            detail: 'A CLOSED request cannot be reopened.',
            errors: { status: ['Transition from CLOSED to IN_PROGRESS is not allowed.'] },
          },
          { status: 422, headers: { 'content-type': 'application/problem+json' } },
        ),
      ),
    )

    const { user } = renderDetail('REQ-1001')

    await user.selectOptions(await screen.findByLabelText('Move to'), 'CLOSED')
    await user.click(screen.getByRole('button', { name: 'Update status' }))
    await user.click(await screen.findByRole('button', { name: 'Confirm' }))

    expect(
      await screen.findByText('Transition from CLOSED to IN_PROGRESS is not allowed.'),
    ).toBeInTheDocument()
  })

  it('keeps the stored request visible after a successful update', async () => {
    const { user } = renderDetail('REQ-1001')

    await user.selectOptions(await screen.findByLabelText('Move to'), 'CLOSED')
    await user.click(screen.getByRole('button', { name: 'Update status' }))
    await user.click(await screen.findByRole('button', { name: 'Confirm' }))

    await waitFor(() => {
      expect(screen.getByText(/terminal state/i)).toBeInTheDocument()
    })
  })
})
