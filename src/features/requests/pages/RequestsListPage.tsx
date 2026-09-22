import { useMemo } from 'react'
import { Link, useLocation } from 'react-router'

import { Button } from '../../../shared/components/Button'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ErrorState } from '../../../shared/components/ErrorState'
import { useServiceRequests } from '../api/queries'
import { FiltersBar } from '../components/FiltersBar'
import { Pagination } from '../components/Pagination'
import { RequestCardList } from '../components/RequestCardList'
import { RequestsSkeleton } from '../components/RequestsSkeleton'
import { RequestsTable } from '../components/RequestsTable'
import { hasActiveFilters, toApiQuery } from '../model/list-query'
import { useListQuery } from '../model/useListQuery'

export function RequestsListPage() {
  const { query, update, clearFilters } = useListQuery()
  const location = useLocation()

  const apiQuery = useMemo(() => toApiQuery(query), [query])
  const { data, error, isPending, isFetching, isError, refetch } = useServiceRequests(apiQuery)

  const filtersActive = hasActiveFilters(query)
  const listSearch = location.search

  function renderResults() {
    if (isPending) {
      return <RequestsSkeleton />
    }

    if (isError && data === undefined) {
      return (
        <ErrorState
          error={error}
          onRetry={() => {
            void refetch()
          }}
        />
      )
    }

    /* An out-of-range page is a different problem from an empty result set. */
    if (data.items.length === 0 && data.total > 0) {
      return (
        <EmptyState
          title="This page is empty"
          description={`The current filters return ${data.total} requests across ${data.totalPages} pages.`}
          action={
            <Button
              onClick={() => {
                update({ page: 1 })
              }}
            >
              Go to the first page
            </Button>
          }
        />
      )
    }

    if (data.items.length === 0) {
      return filtersActive ? (
        <EmptyState
          title="No request matches these filters"
          description="Try a different search term, or remove one of the active filters."
          action={
            <Button variant="secondary" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <EmptyState
          title="No service requests yet"
          description="Requests raised by customers will show up here."
        />
      )
    }

    return (
      <div
        aria-busy={isFetching}
        className={`space-y-3 ${isFetching ? 'opacity-60 transition-opacity' : ''}`}
      >
        <RequestsTable
          items={data.items}
          total={data.total}
          sort={query.sort}
          listSearch={listSearch}
          onSortChange={(sort) => {
            update({ sort })
          }}
        />

        <RequestCardList items={data.items} listSearch={listSearch} />

        <Pagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          totalPages={data.totalPages}
          onPageChange={(page) => {
            update({ page })
          }}
          onPageSizeChange={(pageSize) => {
            update({ pageSize })
          }}
        />
      </div>
    )
  }

  return (
    <section aria-labelledby="requests-heading" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 id="requests-heading" className="text-2xl font-semibold tracking-tight">
          Service requests
        </h1>
        <Link
          to="/requests/new"
          className="inline-flex items-center justify-center rounded-md bg-brand px-3.5 py-2 text-sm font-medium text-white shadow-soft transition-colors hover:bg-brand-strong"
        >
          New request
        </Link>
      </div>

      <FiltersBar query={query} onChange={update} onClear={clearFilters} />

      <p role="status" className="text-sm text-ink-muted">
        {isPending
          ? 'Loading service requests'
          : data === undefined
            ? ''
            : `${data.total} ${data.total === 1 ? 'request' : 'requests'} found`}
      </p>

      {renderResults()}
    </section>
  )
}
