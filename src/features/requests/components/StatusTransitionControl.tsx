import { useState } from 'react'

import { ApiProblem } from '../../../api/problem'
import { allowedTransitionsFrom, isTerminalStatus } from '../../../api/transitions'
import type { ServiceRequest, ServiceRequestStatus } from '../../../api/types'
import { useAuthSession } from '../../../auth/session'
import { Button } from '../../../shared/components/Button'
import { Modal } from '../../../shared/components/Modal'
import { useToast } from '../../../shared/toast/toast-context'
import { useUpdateRequestStatus } from '../api/mutations'
import { STATUS_LABELS } from '../model/labels'
import { ConflictDialog } from './ConflictDialog'

export interface StatusTransitionControlProps {
  request: ServiceRequest
}

export function StatusTransitionControl({ request }: StatusTransitionControlProps) {
  const { canUpdateStatus } = useAuthSession()
  const { showToast } = useToast()
  const updateStatus = useUpdateRequestStatus(request.id)

  const [target, setTarget] = useState<ServiceRequestStatus | ''>('')
  const [note, setNote] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [conflictOpen, setConflictOpen] = useState(false)
  const [transitionError, setTransitionError] = useState<string | undefined>(undefined)

  const allowed = allowedTransitionsFrom(request.status)

  async function apply(status: ServiceRequestStatus, version: number): Promise<void> {
    setTransitionError(undefined)

    try {
      const updated = await updateStatus.mutateAsync({
        status,
        version,
        ...(note === '' ? {} : { note }),
      })
      setConfirmOpen(false)
      setConflictOpen(false)
      setTarget('')
      setNote('')
      showToast({
        tone: 'success',
        title: 'Status updated',
        description: `${updated.id} is now ${STATUS_LABELS[updated.status]}.`,
      })
    } catch (error) {
      const problem = ApiProblem.fromUnknown(error)

      if (problem.isVersionConflict) {
        setConfirmOpen(false)
        setConflictOpen(true)
        return
      }

      if (problem.isValidationFailure) {
        setTransitionError(
          problem.fieldErrors?.status?.join(' ') ?? problem.detail ?? problem.title,
        )
        setConfirmOpen(false)
        return
      }

      if (problem.isForbidden) {
        setTransitionError(problem.detail ?? 'You do not have permission to change the status.')
        setConfirmOpen(false)
        return
      }

      showToast({
        tone: 'error',
        title: problem.title,
        description: problem.detail,
        traceId: problem.traceId,
      })
    }
  }

  if (isTerminalStatus(request.status)) {
    return (
      <p className="text-sm text-ink-muted">
        This request is closed. Closed is a terminal state, so no further changes are allowed.
      </p>
    )
  }

  if (!canUpdateStatus) {
    return (
      <p className="text-sm text-ink-muted">
        Your account can view this request but cannot change its status.
      </p>
    )
  }

  const selected = target === '' ? undefined : target

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1">
          <label htmlFor="next-status" className="block text-xs font-medium text-ink-muted">
            Move to
          </label>
          <select
            id="next-status"
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
            value={target}
            onChange={(event) => {
              const next = event.target.value
              setTarget(next === '' ? '' : (next as ServiceRequestStatus))
              setTransitionError(undefined)
            }}
          >
            <option value="">Choose a status</option>
            {allowed.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>

        <Button
          disabled={selected === undefined}
          onClick={() => {
            setConfirmOpen(true)
          }}
        >
          Update status
        </Button>
      </div>

      {transitionError !== undefined && (
        <p role="alert" className="text-sm text-danger">
          {transitionError}
        </p>
      )}

      <Modal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirm status change"
        description={
          selected === undefined
            ? undefined
            : `Move ${request.id} from ${STATUS_LABELS[request.status]} to ${STATUS_LABELS[selected]}.`
        }
      >
        <label htmlFor="status-note" className="block text-xs font-medium text-ink-muted">
          Note (optional)
        </label>
        <textarea
          id="status-note"
          maxLength={500}
          rows={3}
          value={note}
          onChange={(event) => {
            setNote(event.target.value)
          }}
          className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-ink-muted">{note.length}/500</p>

        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setConfirmOpen(false)
            }}
          >
            Cancel
          </Button>
          <Button
            isLoading={updateStatus.isPending}
            disabled={selected === undefined}
            onClick={() => {
              if (selected !== undefined) {
                void apply(selected, request.version)
              }
            }}
          >
            Confirm
          </Button>
        </div>
      </Modal>

      <ConflictDialog
        open={conflictOpen}
        current={request}
        onDismiss={() => {
          setConflictOpen(false)
          setTarget('')
        }}
        onRetry={() => {
          if (selected !== undefined) {
            void apply(selected, request.version)
          }
        }}
      />
    </div>
  )
}
