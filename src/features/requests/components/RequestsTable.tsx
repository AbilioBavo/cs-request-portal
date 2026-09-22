import { Link } from 'react-router'

import type { ServiceRequest, SortExpression } from '../../../api/types'
import { formatDateTime } from '../model/labels'
import { PriorityBadge, StatusBadge } from './badges'

export interface RequestsTableProps {
  items: ServiceRequest[]
  total: number
  sort: SortExpression
  onSortChange: (sort: SortExpression) => void
  /** Current list query, carried to the detail page so Back returns to this view. */
  listSearch: string
}

const CELL = 'px-4 py-3 align-top text-sm'
const HEAD_CELL = 'px-4 py-2 text-left text-xs font-semibold text-ink-muted'

function createdAtSortState(sort: SortExpression): 'ascending' | 'descending' | 'none' {
  if (sort === 'createdAt') return 'ascending'
  if (sort === '-createdAt') return 'descending'
  return 'none'
}

export function RequestsTable({
  items,
  total,
  sort,
  onSortChange,
  listSearch,
}: RequestsTableProps) {
  const sortState = createdAtSortState(sort)

  return (
    <div className="hidden overflow-hidden rounded-xl border border-border bg-surface shadow-soft md:block">
      <table className="w-full border-collapse">
        <caption className="sr-only">Service requests, {total} in total</caption>
        <thead className="border-b border-border bg-surface-muted">
          <tr>
            <th scope="col" className={HEAD_CELL}>
              Request
            </th>
            <th scope="col" className={HEAD_CELL}>
              Requester
            </th>
            <th scope="col" className={HEAD_CELL}>
              Priority
            </th>
            <th scope="col" className={HEAD_CELL}>
              Status
            </th>
            <th scope="col" className={HEAD_CELL} aria-sort={sortState}>
              <button
                type="button"
                className="inline-flex items-center gap-1 font-semibold hover:text-ink"
                onClick={() => {
                  onSortChange(sortState === 'descending' ? 'createdAt' : '-createdAt')
                }}
              >
                Created
                <span aria-hidden="true">
                  {sortState === 'ascending'
                    ? '\u2191'
                    : sortState === 'descending'
                      ? '\u2193'
                      : ''}
                </span>
                <span className="sr-only">
                  {sortState === 'descending' ? 'Sort oldest first' : 'Sort newest first'}
                </span>
              </button>
            </th>
          </tr>
        </thead>

        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-border last:border-0">
              <td className={CELL}>
                <Link
                  to={`/requests/${item.id}`}
                  state={{ from: listSearch }}
                  className="font-medium text-brand underline-offset-2 hover:underline"
                >
                  {item.title}
                </Link>
                <span className="mt-0.5 block text-xs text-ink-muted">
                  {item.id} &middot; {item.category}
                </span>
              </td>
              <td className={CELL}>
                {item.requesterName}
                <span className="mt-0.5 block text-xs text-ink-muted">{item.requesterEmail}</span>
              </td>
              <td className={CELL}>
                <PriorityBadge priority={item.priority} />
              </td>
              <td className={CELL}>
                <StatusBadge status={item.status} />
              </td>
              <td className={`${CELL} whitespace-nowrap`}>
                <time dateTime={item.createdAt} title={item.createdAt}>
                  {formatDateTime(item.createdAt)}
                </time>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
