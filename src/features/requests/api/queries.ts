import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { useApiClient } from '../../../api/api-client-context'
import { unwrapData } from '../../../api/client'
import type { ListRequestsQuery, ServiceRequest, ServiceRequestPage } from '../../../api/types'

export const requestKeys = {
  all: ['service-requests'] as const,
  lists: () => [...requestKeys.all, 'list'] as const,
  list: (query: ListRequestsQuery) => [...requestKeys.lists(), query] as const,
  detail: (requestId: string) => [...requestKeys.all, 'detail', requestId] as const,
}

export function useServiceRequests(query: ListRequestsQuery) {
  const api = useApiClient()

  return useQuery<ServiceRequestPage>({
    queryKey: requestKeys.list(query),
    queryFn: async ({ signal }) => {
      const { data } = await api.GET('/requests', { params: { query }, signal })
      return unwrapData(data)
    },
    /* Keeps the previous page on screen while the next one loads. */
    placeholderData: keepPreviousData,
  })
}

export function useServiceRequest(requestId: string) {
  const api = useApiClient()

  return useQuery<ServiceRequest>({
    queryKey: requestKeys.detail(requestId),
    queryFn: async ({ signal }) => {
      const { data } = await api.GET('/requests/{requestId}', {
        params: { path: { requestId } },
        signal,
      })
      return unwrapData(data)
    },
  })
}
