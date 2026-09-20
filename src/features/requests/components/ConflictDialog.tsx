import type { ServiceRequest } from '../../../api/types'
import { Button } from '../../../shared/components/Button'
import { Modal } from '../../../shared/components/Modal'
import { STATUS_LABELS, formatDateTime } from '../model/labels'

export interface ConflictDialogProps {
  open: boolean
  current: ServiceRequest | undefined
  onRetry: () => void
  onDismiss: () => void
}

export function ConflictDialog({ open, current, onRetry, onDismiss }: ConflictDialogProps) {
  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onDismiss()
        }
      }}
      title="This request was updated by someone else"
      description="Refresh and try again with the latest version. Your chosen status has not been applied."
    >
      {current !== undefined && (
        <dl className="mb-4 grid grid-cols-2 gap-2 text-sm">
          <dt className="text-ink-muted">Current status</dt>
          <dd>{STATUS_LABELS[current.status]}</dd>
          <dt className="text-ink-muted">Current version</dt>
          <dd>{current.version}</dd>
          <dt className="text-ink-muted">Last updated</dt>
          <dd>
            <time dateTime={current.updatedAt}>{formatDateTime(current.updatedAt)}</time>
          </dd>
        </dl>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onDismiss}>
          Cancel
        </Button>
        <Button onClick={onRetry}>Retry with latest version</Button>
      </div>
    </Modal>
  )
}
