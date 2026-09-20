import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORT,
  PAGE_SIZE_OPTIONS,
  isServiceRequestPriority,
  isServiceRequestStatus,
  isSortExpression,
} from '../../../api/enums'
import type {
  ListRequestsQuery,
  ServiceRequestPriority,
  ServiceRequestStatus,
  SortExpression,
} from '../../../api/types'

export const SEARCH_MAX_LENGTH = 100

export interface ListQueryState {
  search: string
  status: ServiceRequestStatus | null
  priority: ServiceRequestPriority | null
  sort: SortExpression
  page: number
  pageSize: number
}

export const DEFAULT_LIST_QUERY: ListQueryState = {
  search: '',
  status: null,
  priority: null,
  sort: DEFAULT_SORT,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
}

function parsePage(raw: string | null): number {
  if (raw === null || !/^\d+$/.test(raw)) {
    return DEFAULT_LIST_QUERY.page
  }
  return Math.max(1, Number(raw))
}

function parsePageSize(raw: string | null): number {
  const value = raw === null ? Number.NaN : Number(raw)
  return PAGE_SIZE_OPTIONS.includes(value) ? value : DEFAULT_PAGE_SIZE
}

/**
 * The address bar is user editable, so anything unrecognised falls back to a
 * default instead of being forwarded to the API, which would answer 400.
 */
export function parseListQuery(params: URLSearchParams): ListQueryState {
  const status = params.get('status')
  const priority = params.get('priority')
  const sort = params.get('sort')

  return {
    search: (params.get('search') ?? '').slice(0, SEARCH_MAX_LENGTH),
    status: isServiceRequestStatus(status) ? status : null,
    priority: isServiceRequestPriority(priority) ? priority : null,
    sort: isSortExpression(sort) ? sort : DEFAULT_SORT,
    page: parsePage(params.get('page')),
    pageSize: parsePageSize(params.get('pageSize')),
  }
}

/** Only values that differ from the default are written, keeping URLs short. */
export function toSearchParams(state: ListQueryState): URLSearchParams {
  const params = new URLSearchParams()

  if (state.search !== '') params.set('search', state.search)
  if (state.status !== null) params.set('status', state.status)
  if (state.priority !== null) params.set('priority', state.priority)
  if (state.sort !== DEFAULT_LIST_QUERY.sort) params.set('sort', state.sort)
  if (state.page !== DEFAULT_LIST_QUERY.page) params.set('page', String(state.page))
  if (state.pageSize !== DEFAULT_LIST_QUERY.pageSize) {
    params.set('pageSize', String(state.pageSize))
  }

  return params
}

/** Whitelists the parameters the contract declares; unknown ones are rejected with 400. */
export function toApiQuery(state: ListQueryState): ListRequestsQuery {
  return {
    ...(state.search === '' ? {} : { search: state.search }),
    ...(state.status === null ? {} : { status: state.status }),
    ...(state.priority === null ? {} : { priority: state.priority }),
    sort: state.sort,
    page: state.page,
    pageSize: state.pageSize,
  }
}

export function hasActiveFilters(state: ListQueryState): boolean {
  return state.search !== '' || state.status !== null || state.priority !== null
}
