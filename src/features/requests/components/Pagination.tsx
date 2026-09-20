import { PAGE_SIZE_OPTIONS } from '../../../api/enums'
import { Button } from '../../../shared/components/Button'

export interface PaginationProps {
  page: number
  pageSize: number
  total: number
  totalPages: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

export function Pagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const firstItem = total === 0 ? 0 : (page - 1) * pageSize + 1
  const lastItem = Math.min(page * pageSize, total)

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3"
    >
      <p className="text-sm text-ink-muted">
        Showing {firstItem} to {lastItem} of {total}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-ink-muted" htmlFor="page-size">
          Rows per page
          <select
            id="page-size"
            className="rounded-md border border-border bg-surface px-2 py-1 text-sm text-ink"
            value={pageSize}
            onChange={(event) => {
              onPageSizeChange(Number(event.target.value))
            }}
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            disabled={page <= 1}
            onClick={() => {
              onPageChange(page - 1)
            }}
          >
            Previous
          </Button>

          <span className="text-sm whitespace-nowrap">
            Page {page} of {Math.max(totalPages, 1)}
          </span>

          <Button
            variant="secondary"
            disabled={page >= totalPages}
            onClick={() => {
              onPageChange(page + 1)
            }}
          >
            Next
          </Button>
        </div>
      </div>
    </nav>
  )
}
