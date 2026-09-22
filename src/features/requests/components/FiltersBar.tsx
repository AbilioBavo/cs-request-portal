import { useEffect, useRef, useState } from 'react'

import {
  SERVICE_REQUEST_PRIORITIES,
  SERVICE_REQUEST_STATUSES,
  SORT_EXPRESSIONS,
} from '../../../api/enums'
import {
  isServiceRequestPriority,
  isServiceRequestStatus,
  isSortExpression,
} from '../../../api/enums'
import { Button } from '../../../shared/components/Button'
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue'
import { PRIORITY_LABELS, SORT_LABELS, STATUS_LABELS } from '../model/labels'
import { SEARCH_MAX_LENGTH, hasActiveFilters, type ListQueryState } from '../model/list-query'

const SEARCH_DEBOUNCE_MS = 300

const FIELD_CLASSES =
  'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink shadow-xs'
const LABEL_CLASSES = 'block text-xs font-medium text-ink-muted'

export interface FiltersBarProps {
  query: ListQueryState
  onChange: (patch: Partial<ListQueryState>) => void
  onClear: () => void
}

function SearchField({ value, onSearch }: { value: string; onSearch: (next: string) => void }) {
  const [draft, setDraft] = useState(value)
  const debouncedDraft = useDebouncedValue(draft, SEARCH_DEBOUNCE_MS)
  const applied = useRef(value)

  useEffect(() => {
    if (debouncedDraft !== applied.current) {
      applied.current = debouncedDraft
      onSearch(debouncedDraft)
    }
  }, [debouncedDraft, onSearch])

  // Keeps the box in step with the URL when filters are cleared elsewhere.
  useEffect(() => {
    if (value !== applied.current) {
      applied.current = value
      setDraft(value)
    }
  }, [value])

  return (
    <div className="sm:col-span-2">
      <label className={LABEL_CLASSES} htmlFor="request-search">
        Search
      </label>
      <input
        id="request-search"
        type="search"
        className={`mt-1 ${FIELD_CLASSES}`}
        placeholder="Search requests"
        maxLength={SEARCH_MAX_LENGTH}
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value)
        }}
        aria-describedby="request-search-hint"
      />
      <p id="request-search-hint" className="mt-1 text-xs text-ink-muted">
        Matches the title or the requester name.
      </p>
    </div>
  )
}

export function FiltersBar({ query, onChange, onClear }: FiltersBarProps) {
  return (
    <section
      aria-label="Filters"
      className="rounded-xl border border-border bg-surface p-4 shadow-soft"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <SearchField
          value={query.search}
          onSearch={(search) => {
            onChange({ search })
          }}
        />

        <div>
          <label className={LABEL_CLASSES} htmlFor="request-status">
            Status
          </label>
          <select
            id="request-status"
            className={`mt-1 ${FIELD_CLASSES}`}
            value={query.status ?? ''}
            onChange={(event) => {
              const next = event.target.value
              onChange({ status: isServiceRequestStatus(next) ? next : null })
            }}
          >
            <option value="">All statuses</option>
            {SERVICE_REQUEST_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL_CLASSES} htmlFor="request-priority">
            Priority
          </label>
          <select
            id="request-priority"
            className={`mt-1 ${FIELD_CLASSES}`}
            value={query.priority ?? ''}
            onChange={(event) => {
              const next = event.target.value
              onChange({ priority: isServiceRequestPriority(next) ? next : null })
            }}
          >
            <option value="">All priorities</option>
            {SERVICE_REQUEST_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {PRIORITY_LABELS[priority]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL_CLASSES} htmlFor="request-sort">
            Sort by
          </label>
          <select
            id="request-sort"
            className={`mt-1 ${FIELD_CLASSES}`}
            value={query.sort}
            onChange={(event) => {
              const next = event.target.value
              if (isSortExpression(next)) {
                onChange({ sort: next })
              }
            }}
          >
            {SORT_EXPRESSIONS.map((expression) => (
              <option key={expression} value={expression}>
                {SORT_LABELS[expression]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasActiveFilters(query) && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-ink-muted">Active filters:</span>

          {query.search !== '' && (
            <FilterChip
              label={`Search: ${query.search}`}
              onRemove={() => {
                onChange({ search: '' })
              }}
            />
          )}
          {query.status !== null && (
            <FilterChip
              label={`Status: ${STATUS_LABELS[query.status]}`}
              onRemove={() => {
                onChange({ status: null })
              }}
            />
          )}
          {query.priority !== null && (
            <FilterChip
              label={`Priority: ${PRIORITY_LABELS[query.priority]}`}
              onRemove={() => {
                onChange({ priority: null })
              }}
            />
          )}

          <Button variant="ghost" className="ml-auto" onClick={onClear}>
            Clear all filters
          </Button>
        </div>
      )}
    </section>
  )
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-muted px-2 py-0.5 text-xs">
      {label}
      <button type="button" onClick={onRemove} className="text-ink-muted hover:text-ink">
        <span aria-hidden="true">&times;</span>
        <span className="sr-only">Remove filter {label}</span>
      </button>
    </span>
  )
}
