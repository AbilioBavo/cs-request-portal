import { z } from 'zod'

import type { ServiceRequestPriority } from '../../../api/types'

/**
 * Mirrors the `CreateServiceRequest` constraints from the contract so the user
 * is told about a problem before a request is sent. The API validates again and
 * its per-field messages are merged into the same fields.
 */
export const createRequestSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Use at least 3 characters.')
    .max(120, 'Use at most 120 characters.'),
  description: z
    .string()
    .trim()
    .min(10, 'Describe the problem in at least 10 characters.')
    .max(2000, 'Use at most 2000 characters.'),
  category: z
    .string()
    .trim()
    .min(2, 'Use at least 2 characters.')
    .max(50, 'Use at most 50 characters.'),
  priority: z.enum([
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL',
  ] as const satisfies readonly ServiceRequestPriority[]),
  requesterName: z
    .string()
    .trim()
    .min(2, 'Use at least 2 characters.')
    .max(100, 'Use at most 100 characters.'),
  requesterEmail: z.email('Enter a valid email address.').max(254, 'Use at most 254 characters.'),
})

export type CreateRequestInput = z.infer<typeof createRequestSchema>

const FORM_FIELDS = Object.keys(createRequestSchema.shape) as (keyof CreateRequestInput)[]

export function isCreateRequestField(field: string): field is keyof CreateRequestInput {
  return (FORM_FIELDS as string[]).includes(field)
}

/** Categories seen most often; the contract allows any free text. */
export const CATEGORY_SUGGESTIONS = ['Access', 'Billing', 'Network', 'Outage', 'Hardware']
