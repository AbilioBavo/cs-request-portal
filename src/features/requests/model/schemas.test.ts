import { describe, expect, it } from 'vitest'

import { createRequestSchema } from './schemas'

describe('createRequestSchema', () => {
  const valid = {
    title: 'Unable to access customer portal',
    description: 'The customer receives Account locked after signing in with valid credentials.',
    category: 'Access',
    priority: 'HIGH' as const,
    requesterName: 'Example Customer',
    requesterEmail: 'customer@example.com',
  }

  it('accepts a payload that meets the contract limits', () => {
    expect(createRequestSchema.parse(valid)).toMatchObject({ title: valid.title })
  })

  it('rejects a title shorter than 3 characters', () => {
    const result = createRequestSchema.safeParse({ ...valid, title: 'no' })
    expect(result.success).toBe(false)
  })

  it('rejects a description shorter than 10 characters', () => {
    const result = createRequestSchema.safeParse({ ...valid, description: 'too short' })
    expect(result.success).toBe(false)
  })

  it('rejects an invalid email address', () => {
    const result = createRequestSchema.safeParse({ ...valid, requesterEmail: 'not-an-email' })
    expect(result.success).toBe(false)
  })

  it('trims surrounding whitespace before checking length', () => {
    const result = createRequestSchema.safeParse({ ...valid, title: '  ok title  ' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.title).toBe('ok title')
    }
  })
})
