import { forbidden, unauthorized } from './problem'

export const READ_SCOPE = 'service-requests.read'
export const WRITE_SCOPE = 'service-requests.write'

/**
 * The contract returns 401 and 403 but declares no security scheme, so the mock
 * assumes the usual arrangement for a browser client: a bearer access token
 * whose `scope` claim gates writes. Opaque tokens are accepted as-is because a
 * mock cannot validate a signature.
 */
function decodeScopes(token: string): string[] | null {
  const payload = token.split('.')[1]
  if (payload === undefined) {
    return null
  }

  try {
    const claims: unknown = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    if (typeof claims !== 'object' || claims === null) {
      return null
    }
    const scope = (claims as { scope?: unknown }).scope
    return typeof scope === 'string' ? scope.split(' ') : null
  } catch {
    return null
  }
}

export interface AuthorizeOptions {
  instance: string
  requiredScope: string
}

export function authorize(
  request: Request,
  { instance, requiredScope }: AuthorizeOptions,
): Response | null {
  const header = request.headers.get('authorization')

  if (header === null || !header.toLowerCase().startsWith('bearer ')) {
    return unauthorized(instance, 'The access token is missing or has expired. Sign in again.')
  }

  const scopes = decodeScopes(header.slice('bearer '.length).trim())
  if (scopes !== null && !scopes.includes(requiredScope)) {
    return forbidden(instance, requiredScope)
  }

  return null
}
