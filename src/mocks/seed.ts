import type { ServiceRequest, ServiceRequestPriority, ServiceRequestStatus } from '../api/types'

interface SeedTemplate {
  title: string
  description: string
  category: string
}

const TEMPLATES: SeedTemplate[] = [
  {
    title: 'Unable to access customer portal',
    description: 'The customer receives "Account locked" after signing in with valid credentials.',
    category: 'Access',
  },
  {
    title: 'Duplicate invoice on February statement',
    description: 'Invoice INV-88213 appears twice on the February billing statement.',
    category: 'Billing',
  },
  {
    title: 'Self-service app is down for all users',
    description:
      'Every sign-in attempt returns HTTP 503 since 06:00 UTC across web and mobile clients.',
    category: 'Outage',
  },
  {
    title: 'Password reset email never arrives',
    description: 'Reset messages are not delivered to addresses on the customer corporate domain.',
    category: 'Access',
  },
  {
    title: 'Latency spikes on the northern region',
    description: 'Response times go above eight seconds every weekday between 08:00 and 09:00 UTC.',
    category: 'Network',
  },
  {
    title: 'Refund not reflected on the account balance',
    description:
      'A refund confirmed by the finance team three days ago is still missing from the balance.',
    category: 'Billing',
  },
  {
    title: 'Export to CSV truncates long descriptions',
    description:
      'Descriptions longer than two hundred characters are cut off in the exported file.',
    category: 'Reporting',
  },
  {
    title: 'Two-factor codes rejected on mobile',
    description:
      'Authenticator codes are rejected on Android while the same codes work on desktop.',
    category: 'Access',
  },
  {
    title: 'Notification emails sent twice',
    description: 'Every status change notification is delivered twice to the requester.',
    category: 'Notifications',
  },
  {
    title: 'VPN drops during file upload',
    description: 'Uploads larger than fifty megabytes drop the tunnel and the transfer restarts.',
    category: 'Network',
  },
  {
    title: 'Contract renewal date shown incorrectly',
    description: 'The renewal date is one month ahead of the signed contract for annual plans.',
    category: 'Billing',
  },
  {
    title: 'Search returns no results for valid customers',
    description:
      'Searching by company name returns nothing even though the record exists in the portal.',
    category: 'Reporting',
  },
  {
    title: 'Printer queue stuck on the support floor',
    description:
      'Print jobs stay queued and have to be cancelled manually after every shift change.',
    category: 'Hardware',
  },
  {
    title: 'Chat widget fails to load for guest users',
    description:
      'The support chat widget stays blank for visitors who are not signed in to the portal.',
    category: 'Outage',
  },
]

const REQUESTERS = [
  { name: 'Example Customer', email: 'customer@example.com' },
  { name: 'Second Customer', email: 'second.customer@example.com' },
  { name: 'Operations Desk', email: 'ops.desk@example.com' },
  { name: 'Mariana Silva', email: 'mariana.silva@example.com' },
  { name: 'Tomas Fernandes', email: 'tomas.fernandes@example.com' },
  { name: 'Northwind Logistics', email: 'support@northwind.example.com' },
  { name: 'Helena Costa', email: 'helena.costa@example.com' },
  { name: 'Field Services Team', email: 'field.services@example.com' },
]

const STATUS_CYCLE: ServiceRequestStatus[] = [
  'OPEN',
  'IN_PROGRESS',
  'OPEN',
  'RESOLVED',
  'IN_PROGRESS',
  'CLOSED',
  'OPEN',
]

const PRIORITY_CYCLE: ServiceRequestPriority[] = [
  'HIGH',
  'MEDIUM',
  'CRITICAL',
  'LOW',
  'MEDIUM',
  'HIGH',
  'LOW',
  'CRITICAL',
]

const VERSION_BY_STATUS: Record<ServiceRequestStatus, number> = {
  OPEN: 1,
  IN_PROGRESS: 3,
  RESOLVED: 4,
  CLOSED: 5,
}

export const SEED_SIZE = 42
export const FIRST_SEED_ID = 1001

/** Oldest seeded request; later records are newer so `-createdAt` is stable. */
const FIRST_CREATED_AT = Date.UTC(2026, 0, 12, 7, 15, 0)
const CREATED_AT_STEP_MS = 7 * 60 * 60 * 1000

function at(timestamp: number): string {
  return new Date(timestamp).toISOString().replace(/\.\d{3}Z$/, 'Z')
}

function pick<T>(values: T[], index: number): T {
  const value = values[index % values.length]
  if (value === undefined) {
    throw new Error('Seed template list must not be empty')
  }
  return value
}

/**
 * Deterministic seed: the same 42 records on every run, which keeps tests and
 * demos predictable while still covering every status and priority.
 */
export function buildSeedRequests(): ServiceRequest[] {
  return Array.from({ length: SEED_SIZE }, (_unused, index) => {
    const template = pick(TEMPLATES, index)
    const requester = pick(REQUESTERS, index)
    const status = pick(STATUS_CYCLE, index)
    const priority = pick(PRIORITY_CYCLE, index)
    const createdAt = FIRST_CREATED_AT + index * CREATED_AT_STEP_MS
    const touched = status === 'OPEN' ? 0 : (index % 5) + 1

    return {
      id: `REQ-${FIRST_SEED_ID + index}`,
      title: template.title,
      description: template.description,
      category: template.category,
      priority,
      status,
      requesterName: requester.name,
      requesterEmail: requester.email,
      createdAt: at(createdAt),
      updatedAt: at(createdAt + touched * 3 * 60 * 60 * 1000),
      version: VERSION_BY_STATUS[status],
    }
  })
}
