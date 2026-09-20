import { describe, expect, it } from 'vitest'

import type { ProblemDetails, ServiceRequest, ServiceRequestPage } from '../api/types'
import { readTransitionNotes, replaceRequest } from './store'

const BASE_URL = 'http://localhost/api'

/** Opaque token: the mock cannot verify a signature, so it only checks scopes when present. */
const OPAQUE_TOKEN = 'opaque-access-token'

function jwtWithScopes(scopes: string): string {
  const payload = btoa(JSON.stringify({ scope: scopes }))
  return `header.${payload}.signature`
}

function call(path: string, init: RequestInit = {}, token = OPAQUE_TOKEN): Promise<Response> {
  const headers = new Headers(init.headers)
  headers.set('authorization', `Bearer ${token}`)
  if (init.body !== undefined) {
    headers.set('content-type', 'application/json')
  }
  return fetch(`${BASE_URL}${path}`, { ...init, headers })
}

async function page(path: string): Promise<ServiceRequestPage> {
  const response = await call(path)
  expect(response.status).toBe(200)
  return (await response.json()) as ServiceRequestPage
}

async function problem(response: Response): Promise<ProblemDetails & { errors?: unknown }> {
  expect(response.headers.get('content-type')).toContain('application/problem+json')
  return (await response.json()) as ProblemDetails
}

describe('GET /requests', () => {
  it('returns the newest requests first with contract defaults', async () => {
    const result = await page('/requests')

    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(10)
    expect(result.total).toBe(42)
    expect(result.totalPages).toBe(5)
    expect(result.items).toHaveLength(10)
    expect(result.items[0]?.id).toBe('REQ-1042')
  })

  it('paginates without overlapping items', async () => {
    const first = await page('/requests?page=1&pageSize=5')
    const second = await page('/requests?page=2&pageSize=5')
    const overlap = first.items.filter((item) => second.items.some((other) => other.id === item.id))

    expect(overlap).toEqual([])
    expect(second.items).toHaveLength(5)
  })

  it('sorts ascending when the sort expression has no minus prefix', async () => {
    const result = await page('/requests?sort=createdAt')

    expect(result.items[0]?.id).toBe('REQ-1001')
  })

  it('filters by status', async () => {
    const result = await page('/requests?status=OPEN&pageSize=100')

    expect(result.total).toBe(18)
    expect(result.items.every((item) => item.status === 'OPEN')).toBe(true)
  })

  it('filters by priority', async () => {
    const result = await page('/requests?priority=CRITICAL&pageSize=100')

    expect(result.total).toBeGreaterThan(0)
    expect(result.items.every((item) => item.priority === 'CRITICAL')).toBe(true)
  })

  it('matches the search term against the requester name', async () => {
    const result = await page('/requests?search=NORTHWIND&pageSize=100')

    expect(result.total).toBe(5)
    expect(result.items.every((item) => item.requesterName.includes('Northwind'))).toBe(true)
  })

  it('matches the search term against the title', async () => {
    const result = await page('/requests?search=portal&pageSize=100')

    expect(result.total).toBeGreaterThan(0)
    expect(result.items.every((item) => item.title.toLowerCase().includes('portal'))).toBe(true)
  })

  it('returns an empty page when nothing matches', async () => {
    const result = await page('/requests?search=no-such-request')

    expect(result.items).toEqual([])
    expect(result.total).toBe(0)
    expect(result.totalPages).toBe(0)
  })

  it('rejects unknown query parameters with 400', async () => {
    const response = await call('/requests?unexpected=1')
    const body = await problem(response)

    expect(response.status).toBe(400)
    expect(body.detail).toContain("'unexpected'")
  })

  it('rejects a page size above the documented maximum', async () => {
    const response = await call('/requests?pageSize=101')

    expect(response.status).toBe(400)
    expect((await problem(response)).detail).toContain('between 1 and 100')
  })

  it('answers 401 with a challenge when the bearer token is missing', async () => {
    const response = await fetch(`${BASE_URL}/requests`)

    expect(response.status).toBe(401)
    expect(response.headers.get('www-authenticate')).toContain('Bearer')
  })
})

describe('POST /requests', () => {
  const payload = {
    title: 'Scanner offline in the front office',
    description: 'The shared scanner stopped responding after the firmware update this morning.',
    category: 'Hardware',
    priority: 'HIGH',
    requesterName: 'Front Office',
    requesterEmail: 'front.office@example.com',
  }

  it('creates a request as OPEN with version 1 and a Location header', async () => {
    const response = await call('/requests', { method: 'POST', body: JSON.stringify(payload) })
    const created = (await response.json()) as ServiceRequest

    expect(response.status).toBe(201)
    expect(response.headers.get('location')).toBe(`/api/requests/${created.id}`)
    expect(created.status).toBe('OPEN')
    expect(created.version).toBe(1)
    expect(created.id).toMatch(/^REQ-\d{4,}$/)
  })

  it('reports field level messages for invalid input', async () => {
    const response = await call('/requests', {
      method: 'POST',
      body: JSON.stringify({ ...payload, title: 'no', requesterEmail: 'not-an-email' }),
    })
    const body = await problem(response)

    expect(response.status).toBe(422)
    expect(body.errors).toMatchObject({
      title: ['Title must be at least 3 characters long.'],
      requesterEmail: ['Enter a valid email address.'],
    })
  })

  it('rejects properties the contract does not declare', async () => {
    const response = await call('/requests', {
      method: 'POST',
      body: JSON.stringify({ ...payload, status: 'CLOSED' }),
    })

    expect(response.status).toBe(400)
    expect((await problem(response)).detail).toContain('status')
  })

  it('answers 403 when the token lacks the write scope', async () => {
    const response = await call(
      '/requests',
      { method: 'POST', body: JSON.stringify(payload) },
      jwtWithScopes('openid service-requests.read'),
    )

    expect(response.status).toBe(403)
    expect((await problem(response)).detail).toContain('service-requests.write')
  })
})

describe('GET /requests/{requestId}', () => {
  it('returns the stored request', async () => {
    const response = await call('/requests/REQ-1002')
    const body = (await response.json()) as ServiceRequest

    expect(response.status).toBe(200)
    expect(body.id).toBe('REQ-1002')
  })

  it('answers 404 for an unknown id', async () => {
    const response = await call('/requests/REQ-9999')

    expect(response.status).toBe(404)
    expect((await problem(response)).detail).toContain('REQ-9999')
  })
})

describe('PATCH /requests/{requestId}/status', () => {
  function patch(id: string, body: unknown, token = OPAQUE_TOKEN): Promise<Response> {
    return call(`/requests/${id}/status`, { method: 'PATCH', body: JSON.stringify(body) }, token)
  }

  it('applies an allowed transition and increments the version', async () => {
    const before = (await (await call('/requests/REQ-1001')).json()) as ServiceRequest
    const response = await patch('REQ-1001', {
      status: 'IN_PROGRESS',
      version: before.version,
      note: 'Assigned to the access team.',
    })
    const after = (await response.json()) as ServiceRequest

    expect(response.status).toBe(200)
    expect(after.status).toBe('IN_PROGRESS')
    expect(after.version).toBe(before.version + 1)
    expect(after.updatedAt >= before.updatedAt).toBe(true)
    expect(readTransitionNotes('REQ-1001')).toEqual(['Assigned to the access team.'])
  })

  it('answers 409 when the submitted version is stale', async () => {
    const response = await patch('REQ-1001', { status: 'IN_PROGRESS', version: 99 })

    expect(response.status).toBe(409)
    expect((await problem(response)).title).toBe('Update conflict')
  })

  it('answers 422 for a transition the lifecycle forbids', async () => {
    const closed = (await (await call('/requests/REQ-1006')).json()) as ServiceRequest
    expect(closed.status).toBe('CLOSED')

    const response = await patch('REQ-1006', { status: 'IN_PROGRESS', version: closed.version })
    const body = await problem(response)

    expect(response.status).toBe(422)
    expect(body.title).toBe('Invalid status transition')
    expect(body.errors).toMatchObject({
      status: ['Transition from CLOSED to IN_PROGRESS is not allowed.'],
    })
  })

  it('validates the payload before touching the record', async () => {
    const response = await patch('REQ-1001', { status: 'IN_PROGRESS' })

    expect(response.status).toBe(422)
    expect((await problem(response)).errors).toHaveProperty('version')
  })

  it('answers 404 for an unknown id', async () => {
    const response = await patch('REQ-9999', { status: 'CLOSED', version: 1 })

    expect(response.status).toBe(404)
  })

  it('isolates state between tests', async () => {
    const request = (await (await call('/requests/REQ-1001')).json()) as ServiceRequest

    expect(request.status).toBe('OPEN')
    expect(request.version).toBe(1)
  })

  it('lets a test place a record in a known state', async () => {
    const original = (await (await call('/requests/REQ-1003')).json()) as ServiceRequest
    replaceRequest({ ...original, status: 'RESOLVED', version: 7 })

    const response = await patch('REQ-1003', { status: 'CLOSED', version: 7 })

    expect(response.status).toBe(200)
    expect(((await response.json()) as ServiceRequest).status).toBe('CLOSED')
  })
})
