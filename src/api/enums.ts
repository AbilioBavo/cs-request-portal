import type { ServiceRequestPriority, ServiceRequestStatus, SortExpression } from './types'

/**
 * Statuses in lifecycle order and priorities in business impact order, which is
 * what the UI shows. The `Record` makes the compiler reject a value that the
 * contract adds or removes.
 */
const statusOrder: Record<ServiceRequestStatus, number> = {
  OPEN: 0,
  IN_PROGRESS: 1,
  RESOLVED: 2,
  CLOSED: 3,
}

const priorityOrder: Record<ServiceRequestPriority, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  CRITICAL: 3,
}

export const SERVICE_REQUEST_STATUSES = Object.keys(statusOrder) as ServiceRequestStatus[]
export const SERVICE_REQUEST_PRIORITIES = Object.keys(priorityOrder) as ServiceRequestPriority[]

export const SORT_EXPRESSIONS: SortExpression[] = [
  'createdAt',
  '-createdAt',
  'updatedAt',
  '-updatedAt',
  'priority',
  '-priority',
]

export const DEFAULT_SORT: SortExpression = '-createdAt'
export const DEFAULT_PAGE_SIZE = 10
export const PAGE_SIZE_OPTIONS = [10, 25, 50]
export const MAX_PAGE_SIZE = 100

export function comparePriority(a: ServiceRequestPriority, b: ServiceRequestPriority): number {
  return priorityOrder[a] - priorityOrder[b]
}

export function isServiceRequestStatus(value: unknown): value is ServiceRequestStatus {
  return typeof value === 'string' && value in statusOrder
}

export function isServiceRequestPriority(value: unknown): value is ServiceRequestPriority {
  return typeof value === 'string' && value in priorityOrder
}

export function isSortExpression(value: unknown): value is SortExpression {
  return typeof value === 'string' && SORT_EXPRESSIONS.includes(value as SortExpression)
}
