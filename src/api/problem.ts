import { z } from 'zod'

const PROBLEM_CONTENT_TYPE = 'application/problem+json'

/**
 * Error payloads are parsed instead of cast: a failing server is exactly the
 * situation where the response may not match the contract.
 */
const problemSchema = z.object({
  type: z.string().optional(),
  title: z.string().optional(),
  status: z.number().int().optional(),
  detail: z.string().optional(),
  instance: z.string().optional(),
  traceId: z.string().optional(),
  errors: z.record(z.string(), z.array(z.string())).optional(),
})

export interface ApiProblemInit {
  status: number
  title: string
  detail?: string | undefined
  traceId?: string | undefined
  fieldErrors?: Readonly<Record<string, string[]>> | undefined
}

/** RFC 7807 problem document normalised into a throwable error. */
export class ApiProblem extends Error {
  readonly status: number
  readonly title: string
  readonly detail: string | undefined
  readonly traceId: string | undefined
  readonly fieldErrors: Readonly<Record<string, string[]>> | undefined

  constructor(init: ApiProblemInit) {
    super(init.detail ?? init.title)
    this.name = 'ApiProblem'
    this.status = init.status
    this.title = init.title
    this.detail = init.detail
    this.traceId = init.traceId
    this.fieldErrors = init.fieldErrors
  }

  static async fromResponse(response: Response): Promise<ApiProblem> {
    const fallbackTitle = response.statusText || 'Request failed'

    if (!response.headers.get('content-type')?.includes(PROBLEM_CONTENT_TYPE)) {
      return new ApiProblem({ status: response.status, title: fallbackTitle })
    }

    const parsed = problemSchema.safeParse(await response.json().catch(() => null))
    if (!parsed.success) {
      return new ApiProblem({ status: response.status, title: fallbackTitle })
    }

    const problem = parsed.data
    return new ApiProblem({
      status: problem.status ?? response.status,
      title: problem.title ?? fallbackTitle,
      detail: problem.detail,
      traceId: problem.traceId,
      fieldErrors: problem.errors,
    })
  }

  /** Wraps transport failures (offline, DNS, CORS) so callers only handle one error type. */
  static fromUnknown(error: unknown): ApiProblem {
    if (error instanceof ApiProblem) {
      return error
    }

    return new ApiProblem({
      status: 0,
      title: 'Network error',
      detail:
        error instanceof Error
          ? `The request could not be sent: ${error.message}`
          : 'The request could not be sent. Check your connection and try again.',
    })
  }

  get isUnauthenticated(): boolean {
    return this.status === 401
  }

  get isForbidden(): boolean {
    return this.status === 403
  }

  get isNotFound(): boolean {
    return this.status === 404
  }

  get isVersionConflict(): boolean {
    return this.status === 409
  }

  get isValidationFailure(): boolean {
    return this.status === 422
  }

  get isRetryable(): boolean {
    return this.status === 0 || this.status >= 500
  }
}
