import createClient, { type Middleware } from 'openapi-fetch'

import { ApiProblem } from './problem'
import type { paths } from './schema'

export type ApiClient = ReturnType<typeof createApiClient>

export interface ApiClientOptions {
  baseUrl: string
  /** Returns the current access token, or undefined while signed out. */
  getAccessToken?: () => string | undefined
  /** Called once per rejected request so the auth layer can try to recover. */
  onUnauthenticated?: () => void
}

export function createApiClient({
  baseUrl,
  getAccessToken,
  onUnauthenticated,
}: ApiClientOptions): ReturnType<typeof createClient<paths>> {
  const client = createClient<paths>({ baseUrl })

  const middleware: Middleware = {
    onRequest({ request }) {
      const token = getAccessToken?.()
      if (token !== undefined && token !== '') {
        request.headers.set('Authorization', `Bearer ${token}`)
      }
      request.headers.set('Accept', 'application/json, application/problem+json')
      return request
    },

    async onResponse({ response }) {
      if (response.ok) {
        return response
      }

      const problem = await ApiProblem.fromResponse(response.clone())
      if (problem.isUnauthenticated) {
        onUnauthenticated?.()
      }
      throw problem
    },

    onError({ error }) {
      throw ApiProblem.fromUnknown(error)
    },
  }

  client.use(middleware)
  return client
}

/**
 * The response middleware throws on every non-2xx, so a successful call always
 * carries a body. This keeps that invariant explicit instead of using `!`.
 */
export function unwrapData<T>(data: T | undefined): T {
  if (data === undefined) {
    throw new ApiProblem({
      status: 0,
      title: 'Empty response',
      detail: 'The API returned no payload where one was expected.',
    })
  }

  return data
}
