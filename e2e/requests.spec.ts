import { expect, test } from '@playwright/test'

test.describe('service request journey', () => {
  test('lists, filters, creates and progresses a request', async ({ page }) => {
    await page.goto('/requests')

    await expect(page.getByRole('heading', { name: 'Service requests' })).toBeVisible()
    await expect(page.getByRole('status')).toContainText('requests found')

    await page.getByLabel('Status').selectOption('OPEN')
    await expect(page).toHaveURL(/status=OPEN/)
    await expect(page.getByRole('status')).toContainText('requests found')

    await page.getByRole('link', { name: 'New request' }).click()
    await expect(page.getByRole('heading', { name: 'New service request' })).toBeVisible()

    await page.getByLabel(/Title/).fill('Cannot print from the meeting room')
    await page
      .getByLabel(/Description/)
      .fill('The meeting room printer rejects every job with a paper jam that is not there.')
    await page.getByLabel(/Category/).fill('Hardware')
    await page.getByLabel(/Priority/).selectOption('HIGH')
    await page.getByLabel(/Requester name/).fill('Meeting Room Desk')
    await page.getByLabel(/Requester email/).fill('meeting.room@example.com')
    await page.getByRole('button', { name: 'Create request' }).click()

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Cannot print from the meeting room',
    )
    await expect(page.getByText('Open')).toBeVisible()

    await page.getByLabel('Move to').selectOption('IN_PROGRESS')
    await page.getByRole('button', { name: 'Update status' }).click()
    await page.getByRole('button', { name: 'Confirm' }).click()

    await expect(page.getByText('In progress')).toBeVisible()
  })

  test('shows an empty filtered result with a way out', async ({ page }) => {
    await page.goto('/requests?search=no-such-request')

    await expect(page.getByText('No request matches these filters')).toBeVisible()
    await page.getByRole('button', { name: 'Clear filters' }).click()
    await expect(page.getByRole('status')).toContainText('42 requests found')
  })
})
