import { Link, useLocation, useParams } from 'react-router'

import { ApiProblem } from '../../../api/problem'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ErrorState } from '../../../shared/components/ErrorState'
import { FullPageStatus } from '../../../shared/components/FullPageStatus'
import { useServiceRequest } from '../api/queries'
import { PriorityBadge, StatusBadge } from '../components/badges'
import { formatDateTime } from '../model/labels'

/** Returns to the list with the filters the user came from, when known. */
function readBackTo(state: unknown): string {
  if (typeof state !== 'object' || state === null || !('from' in state)) {
    return '/requests'
  }

  const { from } = state
  return typeof from === 'string' && from.startsWith('?') ? `/requests${from}` : '/requests'
}

export function RequestDetailPage() {
  const { requestId = '' } = useParams<{ requestId: string }>()
  const location = useLocation()
  const backTo = readBackTo(location.state)

  const { data, error, isPending, isError, refetch } = useServiceRequest(requestId)

  const backLink = (
    <Link to={backTo} className="text-sm font-medium text-brand underline-offset-2 hover:underline">
      Back to results
    </Link>
  )

  if (isPending) {
    return <FullPageStatus label="Loading the service request" />
  }

  if (isError) {
    const problem = ApiProblem.fromUnknown(error)

    return (
      <div className="space-y-4">
        {backLink}
        {problem.isNotFound ? (
          <EmptyState
            title="Service request not found"
            description={problem.detail ?? `No service request exists with id ${requestId}.`}
          />
        ) : (
          <ErrorState
            error={error}
            onRetry={() => {
              void refetch()
            }}
          />
        )}
      </div>
    )
  }

  return (
    <article className="space-y-4">
      {backLink}

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={data.status} />
          <PriorityBadge priority={data.priority} />
          <span className="text-xs text-ink-muted">
            {data.id} &middot; {data.category}
          </span>
        </div>

        <h1 className="text-xl font-semibold">{data.title}</h1>
      </header>

      <section
        aria-labelledby="request-description-heading"
        className="rounded-lg border border-border bg-surface p-4"
      >
        <h2 id="request-description-heading" className="text-sm font-semibold">
          Description
        </h2>
        <p className="mt-2 text-sm whitespace-pre-line text-ink">{data.description}</p>
      </section>

      <section
        aria-labelledby="request-details-heading"
        className="rounded-lg border border-border bg-surface p-4"
      >
        <h2 id="request-details-heading" className="text-sm font-semibold">
          Details
        </h2>

        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-ink-muted">Requester</dt>
            <dd>{data.requesterName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-ink-muted">Contact</dt>
            <dd>
              <a
                href={`mailto:${data.requesterEmail}`}
                className="text-brand underline-offset-2 hover:underline"
              >
                {data.requesterEmail}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-ink-muted">Created</dt>
            <dd>
              <time dateTime={data.createdAt} title={data.createdAt}>
                {formatDateTime(data.createdAt)}
              </time>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-ink-muted">Last updated</dt>
            <dd>
              <time dateTime={data.updatedAt} title={data.updatedAt}>
                {formatDateTime(data.updatedAt)}
              </time>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-ink-muted">Version</dt>
            <dd>{data.version}</dd>
          </div>
        </dl>
      </section>
    </article>
  )
}
