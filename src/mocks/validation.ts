import { z } from 'zod'

import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORT,
  MAX_PAGE_SIZE,
  isServiceRequestPriority,
  isServiceRequestStatus,
  isSortExpression,
} from '../api/enums'
import type { CreateServiceRequest } from '../api/types'
import type { ListQuery, StatusUpdate } from './store'

const SUPPORTED_LIST_PARAMS = ['search', 'status', 'priority', 'sort', 'page', 'pageSize']
const SEARCH_MAX_LENGTH = 100

type Parsed<T> = { ok: true; value: T } | { ok: false; detail: string }

function invalid(detail: string): { ok: false; detail: string } {
  return { ok: false, detail }
}

function parsePositiveInteger(raw: string, name: string, max?: number): Parsed<number> {
  if (!/^\d+$/.test(raw)) {
    return invalid(`Query parameter '${name}' must be a positive integer.`)
  }

  const value = Number(raw)
  if (value < 1 || (max !== undefined && value > max)) {
    return invalid(
      max === undefined
        ? `Query parameter '${name}' must be greater than or equal to 1.`
        : `Query parameter '${name}' must be between 1 and ${max}.`,
    )
  }

  return { ok: true, value }
}

/** Mirrors the API contract: unknown query parameters are rejected with 400. */
export function parseListQuery(searchParams: URLSearchParams): Parsed<ListQuery> {
  for (const key of searchParams.keys()) {
    if (!SUPPORTED_LIST_PARAMS.includes(key)) {
      return invalid(`Query parameter '${key}' is not supported.`)
    }
  }

  const search = searchParams.get('search')
  if (search !== null && search.length > SEARCH_MAX_LENGTH) {
    return invalid(`Query parameter 'search' must be at most ${SEARCH_MAX_LENGTH} characters.`)
  }

  const status = searchParams.get('status')
  if (status !== null && !isServiceRequestStatus(status)) {
    return invalid(`Query parameter 'status' must be one of OPEN, IN_PROGRESS, RESOLVED, CLOSED.`)
  }

  const priority = searchParams.get('priority')
  if (priority !== null && !isServiceRequestPriority(priority)) {
    return invalid(`Query parameter 'priority' must be one of LOW, MEDIUM, HIGH, CRITICAL.`)
  }

  const sort = searchParams.get('sort')
  if (sort !== null && !isSortExpression(sort)) {
    return invalid(`Query parameter 'sort' is not a supported sort expression.`)
  }

  const rawPage = searchParams.get('page')
  const page =
    rawPage === null ? { ok: true as const, value: 1 } : parsePositiveInteger(rawPage, 'page')
  if (!page.ok) {
    return page
  }

  const rawPageSize = searchParams.get('pageSize')
  const pageSize =
    rawPageSize === null
      ? { ok: true as const, value: DEFAULT_PAGE_SIZE }
      : parsePositiveInteger(rawPageSize, 'pageSize', MAX_PAGE_SIZE)
  if (!pageSize.ok) {
    return pageSize
  }

  return {
    ok: true,
    value: {
      ...(search === null ? {} : { search }),
      ...(status === null ? {} : { status }),
      ...(priority === null ? {} : { priority }),
      sort: sort ?? DEFAULT_SORT,
      page: page.value,
      pageSize: pageSize.value,
    },
  }
}

/** Constraints copied from `CreateServiceRequest` in the contract. */
const createRequestSchema = z.strictObject({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters long.')
    .max(120, 'Title must be at most 120 characters long.'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters long.')
    .max(2000, 'Description must be at most 2000 characters long.'),
  category: z
    .string()
    .min(2, 'Category must be at least 2 characters long.')
    .max(50, 'Category must be at most 50 characters long.'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], {
    message: 'Priority must be one of LOW, MEDIUM, HIGH, CRITICAL.',
  }),
  requesterName: z
    .string()
    .min(2, 'Requester name must be at least 2 characters long.')
    .max(100, 'Requester name must be at most 100 characters long.'),
  requesterEmail: z
    .email('Enter a valid email address.')
    .max(254, 'Email address must be at most 254 characters long.'),
})

const statusUpdateSchema = z.strictObject({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'], {
    message: 'Status must be one of OPEN, IN_PROGRESS, RESOLVED, CLOSED.',
  }),
  version: z
    .number()
    .int('Version must be an integer.')
    .min(1, 'Version must be greater than or equal to 1.'),
  note: z.string().max(500, 'Note must be at most 500 characters long.').optional(),
})

export type BodyValidation<T> =
  | { ok: true; value: T }
  | { ok: false; kind: 'malformed'; detail: string }
  | { ok: false; kind: 'invalid'; errors: Record<string, string[]> }

function toBodyValidation<T>(result: z.ZodSafeParseResult<T>): BodyValidation<T> {
  if (result.success) {
    return { ok: true, value: result.data }
  }

  const unknownKeys = result.error.issues.find((issue) => issue.code === 'unrecognized_keys')
  if (unknownKeys !== undefined) {
    return {
      ok: false,
      kind: 'malformed',
      detail: `The payload contains properties that the API does not accept: ${unknownKeys.keys.join(', ')}.`,
    }
  }

  const errors: Record<string, string[]> = {}
  for (const issue of result.error.issues) {
    const field = issue.path[0]
    const key = typeof field === 'string' ? field : '_'
    errors[key] = [...(errors[key] ?? []), issue.message]
  }

  return { ok: false, kind: 'invalid', errors }
}

export function validateCreateRequest(body: unknown): BodyValidation<CreateServiceRequest> {
  return toBodyValidation(createRequestSchema.safeParse(body))
}

export function validateStatusUpdate(body: unknown): BodyValidation<StatusUpdate> {
  return toBodyValidation(statusUpdateSchema.safeParse(body))
}
