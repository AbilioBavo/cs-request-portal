import { describe, expect, it } from 'vitest'

import { SERVICE_REQUEST_STATUSES } from './enums'
import { ALLOWED_TRANSITIONS, canTransition, isTerminalStatus } from './transitions'

describe('status transitions', () => {
  it('covers every status declared by the contract', () => {
    expect(Object.keys(ALLOWED_TRANSITIONS).sort()).toEqual([...SERVICE_REQUEST_STATUSES].sort())
  })

  it.each([
    ['OPEN', 'IN_PROGRESS'],
    ['OPEN', 'CLOSED'],
    ['IN_PROGRESS', 'RESOLVED'],
    ['IN_PROGRESS', 'OPEN'],
    ['RESOLVED', 'CLOSED'],
    ['RESOLVED', 'IN_PROGRESS'],
  ] as const)('allows %s to %s', (from, to) => {
    expect(canTransition(from, to)).toBe(true)
  })

  it('treats CLOSED as terminal', () => {
    expect(isTerminalStatus('CLOSED')).toBe(true)
    expect(canTransition('CLOSED', 'OPEN')).toBe(false)
    expect(canTransition('CLOSED', 'IN_PROGRESS')).toBe(false)
  })

  it('rejects a skip from OPEN to RESOLVED', () => {
    expect(canTransition('OPEN', 'RESOLVED')).toBe(false)
  })
})
