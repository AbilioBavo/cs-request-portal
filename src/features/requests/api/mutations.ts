import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useApiClient } from '../../../api/api-client-context'
import { unwrapData } from '../../../api/client'
import type {
  CreateServiceRequest,
  ServiceRequest,
  UpdateServiceRequestStatus,
} from '../../../api/types'
import { requestKeys } from './queries'

export function useCreateRequest() {
  const api = useApiClient()
  const queryClient = useQueryClient()

  return useMutation<ServiceRequest, unknown, CreateServiceRequest>({
    mutationFn: async (body) => {
      const { data } = await api.POST('/requests', { body })
      return unwrapData(data)
    },
    onSuccess: async (created) => {
      queryClient.setQueryData(requestKeys.detail(created.id), created)
      await queryClient.invalidateQueries({ queryKey: requestKeys.lists() })
    },
  })
}

export function useUpdateRequestStatus(requestId: string) {
  const api = useApiClient()
  const queryClient = useQueryClient()

  return useMutation<ServiceRequest, unknown, UpdateServiceRequestStatus>({
    mutationFn: async (body) => {
      const { data } = await api.PATCH('/requests/{requestId}/status', {
        params: { path: { requestId } },
        body,
      })
      return unwrapData(data)
    },
    onSuccess: async (updated) => {
      queryClient.setQueryData(requestKeys.detail(updated.id), updated)
      await queryClient.invalidateQueries({ queryKey: requestKeys.lists() })
    },
    onError: async () => {
      /*
       * Any rejection may mean the local copy is stale, and a 409 certainly
       * does, so the detail query is refreshed before the user retries.
       */
      await queryClient.invalidateQueries({ queryKey: requestKeys.detail(requestId) })
    },
  })
}
