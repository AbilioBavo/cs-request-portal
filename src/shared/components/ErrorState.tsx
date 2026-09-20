import { ApiProblem } from '../../api/problem'
import { Button } from './Button'

export interface ErrorStateProps {
  error: unknown
  onRetry?: (() => void) | undefined
  title?: string | undefined
}

/**
 * Every failure reaches the user as the server described it: the problem title
 * and detail, plus the trace id to quote when asking for support.
 */
export function ErrorState({ error, onRetry, title }: ErrorStateProps) {
  const problem = ApiProblem.fromUnknown(error)

  return (
    <div role="alert" className="rounded-lg border border-danger bg-danger-surface p-6">
      <h2 className="text-base font-semibold text-danger">{title ?? problem.title}</h2>
      <p className="mt-2 text-sm text-ink">
        {problem.detail ?? 'The request could not be completed.'}
      </p>

      {onRetry !== undefined && (
        <Button variant="secondary" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}

      {problem.traceId !== undefined && (
        <p className="mt-4 font-mono text-xs text-ink-muted">Trace {problem.traceId}</p>
      )}
    </div>
  )
}
