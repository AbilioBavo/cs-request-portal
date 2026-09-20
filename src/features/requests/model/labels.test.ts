import { describe, expect, it } from 'vitest'

import { formatDateTime, PRIORITY_LABELS, STATUS_LABELS } from './labels'

describe('labels', () => {
  it('uses sentence case for every status and priority', () => {
    expect(STATUS_LABELS.IN_PROGRESS).toBe('In progress')
    expect(PRIORITY_LABELS.CRITICAL).toBe('Critical')
  })

  it('formats a UTC timestamp in the reader locale', () => {
    expect(formatDateTime('2026-02-10T08:15:00Z')).toContain('2026')
  })

  it('returns the original string when the timestamp is invalid', () => {
    expect(formatDateTime('not-a-date')).toBe('not-a-date')
  })
})
