import { HttpResponse, delay, http } from 'msw'

import { READ_SCOPE, WRITE_SCOPE, authorize } from './auth'
import { mockLatency } from './config'
import { badRequest, notFound, problemResponse, validationFailed } from './problem'
import { createRequest, findRequest, listRequests, updateRequestStatus } from './store'
import { parseListQuery, validateCreateRequest, validateStatusUpdate } from './validation'

/**
 * Leading wildcard so the same handlers work against a relative base URL in the
 * browser and an absolute one in tests.
 */
const LIST_PATH = '*/requests'
const DETAIL_PATH = '*/requests/:requestId'
const STATUS_PATH = '*/requests/:requestId/status'

async function readJsonBody(
  request: Request,
): Promise<{ ok: true; body: unknown } | { ok: false }> {
  try {
    return { ok: true, body: await request.json() }
  } catch {
    return { ok: false }
  }
}

export const handlers = [
  http.get(LIST_PATH, async ({ request }) => {
    const url = new URL(request.url)
    const denied = authorize(request, { instance: url.pathname, requiredScope: READ_SCOPE })
    if (denied !== null) {
      return denied
    }

    const parsed = parseListQuery(url.searchParams)
    if (!parsed.ok) {
      return badRequest(url.pathname, parsed.detail)
    }

    await delay(mockLatency.ms)
    return HttpResponse.json(listRequests(parsed.value))
  }),

  http.post(LIST_PATH, async ({ request }) => {
    const url = new URL(request.url)
    const denied = authorize(request, { instance: url.pathname, requiredScope: WRITE_SCOPE })
    if (denied !== null) {
      return denied
    }

    const json = await readJsonBody(request)
    if (!json.ok) {
      return badRequest(url.pathname, 'The request body is not valid JSON.')
    }

    const validated = validateCreateRequest(json.body)
    if (!validated.ok) {
      return validated.kind === 'malformed'
        ? badRequest(url.pathname, validated.detail)
        : validationFailed(
            url.pathname,
            'The submitted service request contains invalid fields.',
            validated.errors,
          )
    }

    await delay(mockLatency.ms)
    const created = createRequest(validated.value)

    return HttpResponse.json(created, {
      status: 201,
      headers: { location: `${url.pathname}/${created.id}` },
    })
  }),

  http.get(DETAIL_PATH, async ({ request, params }) => {
    const url = new URL(request.url)
    const denied = authorize(request, { instance: url.pathname, requiredScope: READ_SCOPE })
    if (denied !== null) {
      return denied
    }

    const requestId = String(params.requestId)
    const found = findRequest(requestId)
    if (found === undefined) {
      return notFound(url.pathname, requestId)
    }

    await delay(mockLatency.ms)
    return HttpResponse.json(found)
  }),

  http.patch(STATUS_PATH, async ({ request, params }) => {
    const url = new URL(request.url)
    const denied = authorize(request, { instance: url.pathname, requiredScope: WRITE_SCOPE })
    if (denied !== null) {
      return denied
    }

    const json = await readJsonBody(request)
    if (!json.ok) {
      return badRequest(url.pathname, 'The request body is not valid JSON.')
    }

    const validated = validateStatusUpdate(json.body)
    if (!validated.ok) {
      return validated.kind === 'malformed'
        ? badRequest(url.pathname, validated.detail)
        : validationFailed(
            url.pathname,
            'The submitted status update contains invalid fields.',
            validated.errors,
          )
    }

    const requestId = String(params.requestId)
    const result = updateRequestStatus(requestId, validated.value)
    await delay(mockLatency.ms)

    switch (result.outcome) {
      case 'not-found':
        return notFound(url.pathname, requestId)

      case 'conflict':
        return problemResponse({
          status: 409,
          type: 'version-conflict',
          title: 'Update conflict',
          detail: 'The request was updated by someone else. Refresh and try again.',
          instance: url.pathname,
        })

      case 'invalid-transition':
        return problemResponse({
          status: 422,
          type: 'validation-error',
          title: 'Invalid status transition',
          detail: `A ${result.from} request cannot be moved to ${result.to}.`,
          instance: url.pathname,
          errors: {
            status: [`Transition from ${result.from} to ${result.to} is not allowed.`],
          },
        })

      case 'updated':
        return HttpResponse.json(result.request)
    }
  }),
]
