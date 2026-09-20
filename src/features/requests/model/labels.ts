import type {
  ServiceRequestPriority,
  ServiceRequestStatus,
  SortExpression,
} from '../../../api/types'

export const STATUS_LABELS: Record<ServiceRequestStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
}

export const PRIORITY_LABELS: Record<ServiceRequestPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
}

export const SORT_LABELS: Record<SortExpression, string> = {
  '-createdAt': 'Newest first',
  createdAt: 'Oldest first',
  '-updatedAt': 'Recently updated',
  updatedAt: 'Least recently updated',
  '-priority': 'Highest priority first',
  priority: 'Lowest priority first',
}

const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

/** Timestamps arrive as RFC 3339 UTC and are shown in the reader's own timezone. */
export function formatDateTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp)
  return Number.isNaN(date.getTime()) ? isoTimestamp : dateTimeFormat.format(date)
}
