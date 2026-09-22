import { screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '../../../mocks/server'
import { renderRoute } from '../../../test/render'
import { CreateRequestPage } from './CreateRequestPage'

function renderCreate() {
  return renderRoute(<CreateRequestPage />, {
    path: '/requests/new',
    initialEntry: '/requests/new',
  })
}

const validInput = {
  title: 'Scanner offline in the front office',
  description: 'The shared scanner stopped responding after the firmware update this morning.',
  category: 'Hardware',
  requesterName: 'Front Office',
  requesterEmail: 'front.office@example.com',
}

async function fillValidForm(user: ReturnType<typeof renderCreate>['user']): Promise<void> {
  await user.type(screen.getByLabelText(/Title/), validInput.title)
  await user.type(screen.getByLabelText(/Description/), validInput.description)
  await user.type(screen.getByLabelText(/Category/), validInput.category)
  await user.selectOptions(screen.getByLabelText(/Priority/), 'HIGH')
  await user.type(screen.getByLabelText(/Requester name/), validInput.requesterName)
  await user.type(screen.getByLabelText(/Requester email/), validInput.requesterEmail)
}

describe('CreateRequestPage', () => {
  it('blocks a title that is too short before sending a request', async () => {
    const { user } = renderCreate()

    await user.type(screen.getByLabelText(/Title/), 'no')
    await user.type(screen.getByLabelText(/Description/), validInput.description)
    await user.type(screen.getByLabelText(/Category/), validInput.category)
    await user.type(screen.getByLabelText(/Requester name/), validInput.requesterName)
    await user.type(screen.getByLabelText(/Requester email/), validInput.requesterEmail)
    await user.click(screen.getByRole('button', { name: 'Review request' }))

    expect(await screen.findByText('Use at least 3 characters.')).toBeInTheDocument()
  })

  it('shows a review step and creates only after confirmation', async () => {
    const { user } = renderCreate()
    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Review request' }))

    expect(await screen.findByText('Review before creating')).toBeInTheDocument()
    expect(screen.getByText(validInput.title)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Create request' }))

    await waitFor(() => {
      expect(screen.getByTestId('other-location')).toBeInTheDocument()
    })
  })

  it('returns to the form when Edit is chosen on the review step', async () => {
    const { user } = renderCreate()
    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Review request' }))
    await user.click(await screen.findByRole('button', { name: 'Edit' }))

    expect(screen.getByRole('button', { name: 'Review request' })).toBeInTheDocument()
    expect(screen.getByLabelText(/Title/)).toHaveValue(validInput.title)
  })

  it('shows server field errors on a 422 response', async () => {
    server.use(
      http.post('*/requests', () =>
        HttpResponse.json(
          {
            title: 'Validation failed',
            status: 422,
            detail: 'The submitted service request contains invalid fields.',
            errors: { title: ['Title must be at least 3 characters long.'] },
          },
          { status: 422, headers: { 'content-type': 'application/problem+json' } },
        ),
      ),
    )

    const { user } = renderCreate()
    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Review request' }))
    await user.click(await screen.findByRole('button', { name: 'Create request' }))

    expect(await screen.findByText('Title must be at least 3 characters long.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Review request' })).toBeInTheDocument()
  })
})
