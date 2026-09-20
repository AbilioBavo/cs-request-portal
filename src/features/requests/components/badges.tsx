import type { ServiceRequestPriority, ServiceRequestStatus } from '../../../api/types'
import { PRIORITY_LABELS, STATUS_LABELS } from '../model/labels'

const BADGE_BASE =
  'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap'

const STATUS_STYLES: Record<ServiceRequestStatus, string> = {
  OPEN: 'border-info bg-info-surface text-info',
  IN_PROGRESS: 'border-warning bg-warning-surface text-warning',
  RESOLVED: 'border-success bg-success-surface text-success',
  CLOSED: 'border-border bg-surface-muted text-ink-muted',
}

const PRIORITY_STYLES: Record<ServiceRequestPriority, string> = {
  LOW: 'border-border bg-surface-muted text-ink-muted',
  MEDIUM: 'border-info bg-info-surface text-info',
  HIGH: 'border-warning bg-warning-surface text-warning',
  CRITICAL: 'border-danger bg-danger-surface text-danger',
}

/** Colour is never the only signal: every badge also carries its label. */
export function StatusBadge({ status }: { status: ServiceRequestStatus }) {
  return <span className={`${BADGE_BASE} ${STATUS_STYLES[status]}`}>{STATUS_LABELS[status]}</span>
}

export function PriorityBadge({ priority }: { priority: ServiceRequestPriority }) {
  return (
    <span className={`${BADGE_BASE} ${PRIORITY_STYLES[priority]}`}>
      {PRIORITY_LABELS[priority]}
    </span>
  )
}
