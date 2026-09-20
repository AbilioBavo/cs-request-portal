import { screen, waitFor, waitForElementToBeRemoved, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '../../../mocks/server'
import { renderRoute } from '../../../test/render'
import { RequestsListPage } from './RequestsListPage'

const ROUTE = { path: '/requests', initialEntry: '/requests' }

function renderList(initialEntry = ROUTE.initialEntry) {
  return renderRoute(<RequestsListPage />, { ...ROUTE, initialEntry })
}

async function waitForResults(): Promise<void> {
  await waitForElementToBeRemoved(() => screen.queryByTestId('requests-skeleton'))
}

function resultsTable(): HTMLElement {
  return screen.getByRole('table')
}

describe('RequestsListPage', () => {
  it('shows the first page of requests with the total count', async () => {
    renderList()

    expect(screen.getByTestId('requests-skeleton')).toBeInTheDocument()
    await waitForResults()

    expect(screen.getByRole('status')).toHaveTextContent('42 requests found')
    expect(within(resultsTable()).getAllByRole('row')).toHaveLength(11)
    expect(screen.getByText('Showing 1 to 10 of 42')).toBeInTheDocument()
  })

  it('reads the active filters from the URL', async () => {
    renderList('/requests?status=RESOLVED&pageSize=25')
    await waitForResults()

    expect(screen.getByLabelText('Status')).toHaveValue('RESOLVED')
    expect(screen.getByRole('status')).toHaveTextContent('6 requests found')
    expect(screen.getByText('Active filters:')).toBeInTheDocument()
  })

  it('filters by status and writes the choice to the URL', async () => {
    const { user, currentUrl } = renderList()
    await waitForResults()

    await user.selectOptions(screen.getByLabelText('Status'), 'CLOSED')

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('6 requests found')
    })
    expect(currentUrl()).toBe('/requests?status=CLOSED')
    expect(within(resultsTable()).getAllByText('Closed')).toHaveLength(6)
  })

  it('searches by requester name after the input settles', async () => {
    const { user } = renderList()
    await waitForResults()

    await user.type(screen.getByLabelText('Search'), 'northwind')

    await waitFor(
      () => {
        expect(screen.getByRole('status')).toHaveTextContent('5 requests found')
      },
      { timeout: 2000 },
    )
  })

  it('offers a way out of a filtered empty result', async () => {
    const { user, currentUrl } = renderList('/requests?search=nothing-matches-this')
    await waitForResults()

    expect(screen.getByText('No request matches these filters')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear filters' }))

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('42 requests found')
    })
    expect(currentUrl()).toBe('/requests')
  })

  it('keeps the previous page visible while the next one loads', async () => {
    const { user, currentUrl } = renderList()
    await waitForResults()

    await user.click(screen.getByRole('button', { name: 'Next' }))

    await waitFor(() => {
      expect(screen.getByText('Showing 11 to 20 of 42')).toBeInTheDocument()
    })
    expect(currentUrl()).toBe('/requests?page=2')
    expect(screen.queryByTestId('requests-skeleton')).not.toBeInTheDocument()
  })

  it('returns to the first page when a filter changes', async () => {
    const { user, currentUrl } = renderList('/requests?page=3')
    await waitForResults()

    await user.selectOptions(screen.getByLabelText('Priority'), 'CRITICAL')

    await waitFor(() => {
      expect(currentUrl()).toBe('/requests?priority=CRITICAL')
    })
  })

  it('sorts by creation date from the column header', async () => {
    const { user, currentUrl } = renderList()
    await waitForResults()

    await user.click(screen.getByRole('button', { name: /Created/ }))

    await waitFor(() => {
      expect(currentUrl()).toBe('/requests?sort=createdAt')
    })
    const [header] = within(resultsTable()).getAllByRole('columnheader', { name: /Created/ })
    expect(header).toHaveAttribute('aria-sort', 'ascending')
  })

  it('reports a failing list request and retries on demand', async () => {
    server.use(
      http.get('*/requests', () =>
        HttpResponse.json(
          {
            type: 'https://api.example.test/problems/internal-error',
            title: 'Internal server error',
            status: 500,
            detail: 'An unexpected error occurred. Try again later.',
            traceId: '8fa10c37bb45',
          },
          { status: 500, headers: { 'content-type': 'application/problem+json' } },
        ),
      ),
    )

    const { user } = renderList()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Internal server error')
    expect(alert).toHaveTextContent('8fa10c37bb45')

    server.resetHandlers()
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('42 requests found')
    })
  })
})
