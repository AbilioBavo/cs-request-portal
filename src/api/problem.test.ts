import { describe, expect, it } from 'vitest'

import { ApiProblem } from './problem'

function problemResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/problem+json' },
  })
}

describe('ApiProblem.fromResponse', () => {
  it('reads title, detail and traceId from a problem document', async () => {
    const problem = await ApiProblem.fromResponse(
      problemResponse(404, {
        type: 'https://api.example.test/problems/not-found',
        title: 'Service request not found',
        status: 404,
        detail: 'No service request exists with id REQ-9999.',
        traceId: 'b2c4de6f8091',
      }),
    )

    expect(problem.status).toBe(404)
    expect(problem.title).toBe('Service request not found')
    expect(problem.traceId).toBe('b2c4de6f8091')
    expect(problem.message).toBe('No service request exists with id REQ-9999.')
    expect(problem.isNotFound).toBe(true)
  })

  it('keeps per-field messages from a validation problem', async () => {
    const problem = await ApiProblem.fromResponse(
      problemResponse(422, {
        title: 'Validation failed',
        status: 422,
        errors: {
          title: ['Title must be at least 3 characters long.'],
          requesterEmail: ['Enter a valid email address.'],
        },
      }),
    )

    expect(problem.isValidationFailure).toBe(true)
    expect(problem.fieldErrors).toEqual({
      title: ['Title must be at least 3 characters long.'],
      requesterEmail: ['Enter a valid email address.'],
    })
  })

  it('falls back to the status text when the body is not a problem document', async () => {
    const problem = await ApiProblem.fromResponse(
      new Response('<html>Gateway Timeout</html>', {
        status: 504,
        statusText: 'Gateway Timeout',
        headers: { 'content-type': 'text/html' },
      }),
    )

    expect(problem.title).toBe('Gateway Timeout')
    expect(problem.status).toBe(504)
    expect(problem.isRetryable).toBe(true)
  })

  it('falls back when a problem response carries a malformed body', async () => {
    const problem = await ApiProblem.fromResponse(
      new Response('not json', {
        status: 500,
        statusText: 'Internal Server Error',
        headers: { 'content-type': 'application/problem+json' },
      }),
    )

    expect(problem.status).toBe(500)
    expect(problem.title).toBe('Internal Server Error')
  })

  it('exposes conflict and auth failures through named flags', async () => {
    const conflict = await ApiProblem.fromResponse(
      problemResponse(409, { title: 'Update conflict', status: 409 }),
    )
    const unauthorized = await ApiProblem.fromResponse(
      problemResponse(401, { title: 'Unauthorized', status: 401 }),
    )
    const forbidden = await ApiProblem.fromResponse(
      problemResponse(403, { title: 'Forbidden', status: 403 }),
    )

    expect(conflict.isVersionConflict).toBe(true)
    expect(unauthorized.isUnauthenticated).toBe(true)
    expect(forbidden.isForbidden).toBe(true)
    expect(forbidden.isRetryable).toBe(false)
  })
})

describe('ApiProblem.fromUnknown', () => {
  it('wraps transport failures as a retryable problem', () => {
    const problem = ApiProblem.fromUnknown(new TypeError('Failed to fetch'))

    expect(problem.status).toBe(0)
    expect(problem.title).toBe('Network error')
    expect(problem.isRetryable).toBe(true)
  })

  it('returns the same instance when it is already an ApiProblem', () => {
    const original = new ApiProblem({ status: 500, title: 'Internal server error' })

    expect(ApiProblem.fromUnknown(original)).toBe(original)
  })
})
