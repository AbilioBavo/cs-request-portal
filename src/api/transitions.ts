import type { ServiceRequestStatus } from './types'

/**
 * Transition matrix documented on `PATCH /requests/{requestId}/status`. The UI
 * only offers legal targets and the mock API enforces the same rules, so a 422
 * from the server is a safety net rather than the normal path.
 */
export const ALLOWED_TRANSITIONS: Record<ServiceRequestStatus, readonly ServiceRequestStatus[]> = {
  OPEN: ['IN_PROGRESS', 'CLOSED'],
  IN_PROGRESS: ['RESOLVED', 'OPEN'],
  RESOLVED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: [],
}

export function allowedTransitionsFrom(
  status: ServiceRequestStatus,
): readonly ServiceRequestStatus[] {
  return ALLOWED_TRANSITIONS[status]
}

export function canTransition(from: ServiceRequestStatus, to: ServiceRequestStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to)
}

export function isTerminalStatus(status: ServiceRequestStatus): boolean {
  return ALLOWED_TRANSITIONS[status].length === 0
}
