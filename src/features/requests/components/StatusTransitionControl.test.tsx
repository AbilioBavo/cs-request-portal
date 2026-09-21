import { screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '../../../mocks/server'
import { setAuth } from '../../../test/auth-mock'
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

  it('says so when the account lacks the write scope', async () => {
    setAuth({ user: { scope: 'openid profile email service-requests.read' } })
    renderDetail('REQ-1001')

    expect(await screen.findByText(/cannot change its status/i)).toBeInTheDocument()
    expect(screen.queryByLabelText('Move to')).not.toBeInTheDocument()
  })

  it('surfaces a permission failure next to the control', async () => {
    server.use(
      http.patch('*/requests/:requestId/status', () =>
        HttpResponse.json(
          {
            title: 'Forbidden',
            status: 403,
            detail: 'Your account is missing the service-requests.write scope.',
          },
          { status: 403, headers: { 'content-type': 'application/problem+json' } },
        ),
      ),
    )

    const { user } = renderDetail('REQ-1001')

    await user.selectOptions(await screen.findByLabelText('Move to'), 'IN_PROGRESS')
    await user.click(screen.getByRole('button', { name: 'Update status' }))
    await user.click(await screen.findByRole('button', { name: 'Confirm' }))

    expect(
      await screen.findByText('Your account is missing the service-requests.write scope.'),
    ).toBeInTheDocument()
  })

  it('falls back to a notification for an unexpected failure', async () => {
    server.use(
      http.patch('*/requests/:requestId/status', () =>
        HttpResponse.json(
          {
            title: 'Internal server error',
            status: 500,
            detail: 'An unexpected error occurred. Try again later.',
            traceId: 'ab12cd34',
          },
          { status: 500, headers: { 'content-type': 'application/problem+json' } },
        ),
      ),
    )

    const { user } = renderDetail('REQ-1001')

    await user.selectOptions(await screen.findByLabelText('Move to'), 'IN_PROGRESS')
    await user.click(screen.getByRole('button', { name: 'Update status' }))
    await user.click(await screen.findByRole('button', { name: 'Confirm' }))

    const toast = await screen.findByRole('alert')
    expect(toast).toHaveTextContent('Internal server error')
    expect(toast).toHaveTextContent('Trace ab12cd34')
  })

  it('carries an optional note and can be called off before confirming', async () => {
    const { user } = renderDetail('REQ-1001')

    await user.selectOptions(await screen.findByLabelText('Move to'), 'IN_PROGRESS')
    await user.click(screen.getByRole('button', { name: 'Update status' }))
    await user.type(await screen.findByLabelText(/Note/), 'Waiting on the vendor')

    expect(screen.getByText('21/500')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    await waitFor(() => {
      expect(screen.queryByLabelText(/Note/)).not.toBeInTheDocument()
    })
    expect(screen.getByLabelText('Move to')).toHaveValue('IN_PROGRESS')
  })

  it('retries with the refreshed version after a conflict', async () => {
    // Only the first attempt conflicts; the retry reaches the stateful handler.
    server.use(
      http.patch(
        '*/requests/:requestId/status',
        () =>
          HttpResponse.json(
            { title: 'Update conflict', status: 409 },
            { status: 409, headers: { 'content-type': 'application/problem+json' } },
          ),
        { once: true },
      ),
    )

    const { user } = renderDetail('REQ-1001')

    await user.selectOptions(await screen.findByLabelText('Move to'), 'IN_PROGRESS')
    await user.click(screen.getByRole('button', { name: 'Update status' }))
    await user.click(await screen.findByRole('button', { name: 'Confirm' }))

    await user.click(await screen.findByRole('button', { name: 'Retry with latest version' }))

    expect(await screen.findByText(/is now In progress/i)).toBeInTheDocument()
  })

  it('leaves the request untouched when the conflict dialog is dismissed', async () => {
    server.use(
      http.patch('*/requests/:requestId/status', () =>
        HttpResponse.json(
          { title: 'Update conflict', status: 409 },
          { status: 409, headers: { 'content-type': 'application/problem+json' } },
        ),
      ),
    )

    const { user } = renderDetail('REQ-1001')

    await user.selectOptions(await screen.findByLabelText('Move to'), 'IN_PROGRESS')
    await user.click(screen.getByRole('button', { name: 'Update status' }))
    await user.click(await screen.findByRole('button', { name: 'Confirm' }))
    const dialog = await screen.findByRole('dialog', { name: /updated by someone else/i })
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    await waitFor(() => {
      expect(screen.getByLabelText('Move to')).toHaveValue('')
    })
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
