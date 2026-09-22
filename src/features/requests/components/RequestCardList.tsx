import { Link } from 'react-router'

import type { ServiceRequest } from '../../../api/types'
import { formatDateTime } from '../model/labels'
import { PriorityBadge, StatusBadge } from './badges'

export interface RequestCardListProps {
  items: ServiceRequest[]
  listSearch: string
}

/** Narrow screens get cards; the table above takes over from the md breakpoint. */
export function RequestCardList({ items, listSearch }: RequestCardListProps) {
  return (
    <ul className="space-y-3 md:hidden">
      {items.map((item) => (
        <li key={item.id} className="rounded-xl border border-border bg-surface p-4 shadow-soft">
          <Link
            to={`/requests/${item.id}`}
            state={{ from: listSearch }}
            className="font-medium text-brand underline-offset-2 hover:underline"
          >
            {item.title}
          </Link>

          <p className="mt-1 text-xs text-ink-muted">
            {item.id} &middot; {item.category}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <PriorityBadge priority={item.priority} />
            <StatusBadge status={item.status} />
          </div>

          <dl className="mt-3 space-y-1 text-xs text-ink-muted">
            <div className="flex gap-1">
              <dt className="font-medium">Requester:</dt>
              <dd>{item.requesterName}</dd>
            </div>
            <div className="flex gap-1">
              <dt className="font-medium">Created:</dt>
              <dd>
                <time dateTime={item.createdAt}>{formatDateTime(item.createdAt)}</time>
              </dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  )
}
