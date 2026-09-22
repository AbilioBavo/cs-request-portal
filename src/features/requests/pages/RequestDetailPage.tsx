import { useLocation, useParams } from 'react-router'

import { ApiProblem } from '../../../api/problem'
import { BackLink } from '../../../shared/components/BackLink'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ErrorState } from '../../../shared/components/ErrorState'
import { FullPageStatus } from '../../../shared/components/FullPageStatus'
import { useServiceRequest } from '../api/queries'
import { PriorityBadge, StatusBadge } from '../components/badges'
import { StatusTransitionControl } from '../components/StatusTransitionControl'
import { formatDateTime } from '../model/labels'

const PANEL = 'rounded-xl border border-border bg-surface p-5 shadow-soft'

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

  const backLink = <BackLink to={backTo} />

  if (isPending) {
    return <FullPageStatus label="Loading the service request" />
  }

  if (isError) {
    const problem = ApiProblem.fromUnknown(error)

    return (
      <div className="space-y-5">
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
    <article className="space-y-6">
      {backLink}

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={data.status} />
          <PriorityBadge priority={data.priority} />
          <span className="text-xs tracking-wide text-ink-muted uppercase">
            {data.id} · {data.category}
          </span>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-balance">{data.title}</h1>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="space-y-5">
          <section aria-labelledby="request-description-heading" className={PANEL}>
            <h2 id="request-description-heading" className="text-sm font-semibold tracking-tight">
              Description
            </h2>
            <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-ink">
              {data.description}
            </p>
          </section>

          <section aria-labelledby="request-details-heading" className={PANEL}>
            <h2 id="request-details-heading" className="text-sm font-semibold tracking-tight">
              Details
            </h2>

            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-ink-muted">Requester</dt>
                <dd className="mt-0.5 font-medium">{data.requesterName}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-ink-muted">Contact</dt>
                <dd className="mt-0.5">
                  <a
                    href={`mailto:${data.requesterEmail}`}
                    className="font-medium text-brand underline-offset-2 hover:underline"
                  >
                    {data.requesterEmail}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-ink-muted">Created</dt>
                <dd className="mt-0.5">
                  <time dateTime={data.createdAt} title={data.createdAt}>
                    {formatDateTime(data.createdAt)}
                  </time>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-ink-muted">Last updated</dt>
                <dd className="mt-0.5">
                  <time dateTime={data.updatedAt} title={data.updatedAt}>
                    {formatDateTime(data.updatedAt)}
                  </time>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-ink-muted">Version</dt>
                <dd className="mt-0.5 tabular-nums">{data.version}</dd>
              </div>
            </dl>
          </section>
        </div>

        <aside aria-labelledby="request-status-heading" className={`${PANEL} lg:sticky lg:top-24`}>
          <h2 id="request-status-heading" className="text-sm font-semibold tracking-tight">
            Status
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Only legal transitions are offered. The current version travels with the change so two
            people cannot overwrite each other unnoticed.
          </p>
          <div className="mt-4">
            <StatusTransitionControl request={data} />
          </div>
        </aside>
      </div>
    </article>
  )
}
