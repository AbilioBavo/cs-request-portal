import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'

import { ApiProblem } from '../api/problem'

const MAX_QUERY_RETRIES = 2

export interface QueryClientHandlers {
  /** Reports failures that no screen is showing inline. */
  onBackgroundProblem: (problem: ApiProblem) => void
}

export function createQueryClient({ onBackgroundProblem }: QueryClientHandlers): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) =>
          failureCount < MAX_QUERY_RETRIES && ApiProblem.fromUnknown(error).isRetryable,
      },
      mutations: {
        retry: false,
      },
    },

    /*
     * A query that never resolved renders its own error state, so only a failed
     * background refresh is reported globally. Otherwise the same failure would
     * be announced twice.
     */
    queryCache: new QueryCache({
      onError: (error, query) => {
        if (query.state.data !== undefined) {
          onBackgroundProblem(ApiProblem.fromUnknown(error))
        }
      },
    }),

    /* Mutations surface 409 and 422 in context; transport and server faults do not. */
    mutationCache: new MutationCache({
      onError: (error) => {
        const problem = ApiProblem.fromUnknown(error)
        if (problem.isRetryable) {
          onBackgroundProblem(problem)
        }
      },
    }),
  })
}
