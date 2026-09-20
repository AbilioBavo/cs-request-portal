import { HttpResponse } from 'msw'

const PROBLEM_TYPE_BASE = 'https://api.example.test/problems'
const PROBLEM_CONTENT_TYPE = 'application/problem+json'

export interface ProblemInit {
  status: number
  type: string
  title: string
  instance: string
  detail?: string
  errors?: Record<string, string[]>
  headers?: Record<string, string>
}

function traceId(): string {
  return Array.from({ length: 6 }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, '0'),
  ).join('')
}

export function problemResponse({
  status,
  type,
  title,
  instance,
  detail,
  errors,
  headers,
}: ProblemInit): Response {
  return HttpResponse.json(
    {
      type: `${PROBLEM_TYPE_BASE}/${type}`,
      title,
      status,
      ...(detail === undefined ? {} : { detail }),
      instance,
      traceId: traceId(),
      ...(errors === undefined ? {} : { errors }),
    },
    {
      status,
      headers: { ...headers, 'content-type': PROBLEM_CONTENT_TYPE },
    },
  )
}

export function badRequest(instance: string, detail: string): Response {
  return problemResponse({
    status: 400,
    type: 'bad-request',
    title: 'Invalid request',
    detail,
    instance,
  })
}

export function unauthorized(instance: string, detail: string): Response {
  return problemResponse({
    status: 401,
    type: 'unauthorized',
    title: 'Unauthorized',
    detail,
    instance,
    headers: {
      'www-authenticate': 'Bearer realm="service-requests", error="invalid_token"',
    },
  })
}

export function forbidden(instance: string, scope: string): Response {
  return problemResponse({
    status: 403,
    type: 'forbidden',
    title: 'Forbidden',
    detail: `Scope '${scope}' is required.`,
    instance,
  })
}

export function notFound(instance: string, requestId: string): Response {
  return problemResponse({
    status: 404,
    type: 'not-found',
    title: 'Service request not found',
    detail: `No service request exists with id ${requestId}.`,
    instance,
  })
}

export function validationFailed(
  instance: string,
  detail: string,
  errors: Record<string, string[]>,
): Response {
  return problemResponse({
    status: 422,
    type: 'validation-error',
    title: 'Validation failed',
    detail,
    instance,
    errors,
  })
}
