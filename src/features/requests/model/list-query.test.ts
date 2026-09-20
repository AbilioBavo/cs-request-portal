import { describe, expect, it } from 'vitest'

import {
  DEFAULT_LIST_QUERY,
  hasActiveFilters,
  parseListQuery,
  toApiQuery,
  toSearchParams,
} from './list-query'

function params(query: string): URLSearchParams {
  return new URLSearchParams(query)
}

describe('parseListQuery', () => {
  it('returns defaults for an empty query string', () => {
    expect(parseListQuery(params(''))).toEqual(DEFAULT_LIST_QUERY)
  })

  it('reads every supported parameter', () => {
    expect(
      parseListQuery(
        params('search=portal&status=OPEN&priority=HIGH&sort=createdAt&page=3&pageSize=25'),
      ),
    ).toEqual({
      search: 'portal',
      status: 'OPEN',
      priority: 'HIGH',
      sort: 'createdAt',
      page: 3,
      pageSize: 25,
    })
  })

  it('ignores values that the API would reject with 400', () => {
    expect(
      parseListQuery(
        params('status=QUEUED&priority=URGENT&sort=title&page=-2&pageSize=7&search=ok'),
      ),
    ).toEqual({
      ...DEFAULT_LIST_QUERY,
      search: 'ok',
    })
  })

  it('caps the search term at the documented maximum', () => {
    expect(parseListQuery(params(`search=${'a'.repeat(150)}`)).search).toHaveLength(100)
  })
})

describe('toSearchParams', () => {
  it('omits default values so the URL stays short', () => {
    expect(toSearchParams(DEFAULT_LIST_QUERY).toString()).toBe('')
  })

  it('round trips through parseListQuery', () => {
    const original = {
      search: 'invoice',
      status: 'IN_PROGRESS' as const,
      priority: 'CRITICAL' as const,
      sort: '-priority' as const,
      page: 2,
      pageSize: 50,
    }

    expect(parseListQuery(toSearchParams(original))).toEqual(original)
  })
})

describe('toApiQuery', () => {
  it('sends only the parameters the contract declares', () => {
    expect(
      toApiQuery({
        search: 'portal',
        status: 'OPEN',
        priority: null,
        sort: '-createdAt',
        page: 1,
        pageSize: 10,
      }),
    ).toEqual({
      search: 'portal',
      status: 'OPEN',
      sort: '-createdAt',
      page: 1,
      pageSize: 10,
    })
  })
})

describe('hasActiveFilters', () => {
  it('treats sort and page as view settings, not filters', () => {
    expect(hasActiveFilters({ ...DEFAULT_LIST_QUERY, sort: 'createdAt', page: 4 })).toBe(false)
    expect(hasActiveFilters({ ...DEFAULT_LIST_QUERY, search: 'x' })).toBe(true)
  })
})
