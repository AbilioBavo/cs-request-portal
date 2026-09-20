import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'

import {
  DEFAULT_LIST_QUERY,
  parseListQuery,
  toSearchParams,
  type ListQueryState,
} from './list-query'

export interface ListQueryController {
  query: ListQueryState
  /** Applies a patch; any filter change sends the user back to page 1. */
  update: (patch: Partial<ListQueryState>) => void
  clearFilters: () => void
}

export function useListQuery(): ListQueryController {
  const [searchParams, setSearchParams] = useSearchParams()

  const query = useMemo(() => parseListQuery(searchParams), [searchParams])

  const update = useCallback(
    (patch: Partial<ListQueryState>) => {
      setSearchParams((current) => {
        const next: ListQueryState = { ...parseListQuery(current), ...patch }
        if (!('page' in patch)) {
          next.page = 1
        }
        return toSearchParams(next)
      })
    },
    [setSearchParams],
  )

  const clearFilters = useCallback(() => {
    setSearchParams((current) => {
      const previous = parseListQuery(current)
      return toSearchParams({
        ...DEFAULT_LIST_QUERY,
        sort: previous.sort,
        pageSize: previous.pageSize,
      })
    })
  }, [setSearchParams])

  return { query, update, clearFilters }
}
