import { comparePriority } from '../api/enums'
import { canTransition } from '../api/transitions'
import type {
  CreateServiceRequest,
  ServiceRequest,
  ServiceRequestPage,
  ServiceRequestPriority,
  ServiceRequestStatus,
  SortExpression,
} from '../api/types'
import { FIRST_SEED_ID, SEED_SIZE, buildSeedRequests } from './seed'

export interface ListQuery {
  search?: string | undefined
  status?: ServiceRequestStatus | undefined
  priority?: ServiceRequestPriority | undefined
  sort: SortExpression
  page: number
  pageSize: number
}

export type StatusUpdate = {
  status: ServiceRequestStatus
  version: number
  note?: string | undefined
}

export type StatusUpdateResult =
  | { outcome: 'updated'; request: ServiceRequest }
  | { outcome: 'not-found' }
  | { outcome: 'conflict'; current: ServiceRequest }
  | { outcome: 'invalid-transition'; from: ServiceRequestStatus; to: ServiceRequestStatus }

let requests = buildSeedRequests()
let nextId = FIRST_SEED_ID + SEED_SIZE
let transitionNotes: { requestId: string; note: string; recordedAt: string }[] = []

export function resetStore(): void {
  requests = buildSeedRequests()
  nextId = FIRST_SEED_ID + SEED_SIZE
  transitionNotes = []
}

function now(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
}

/** Callers get copies so that mutating a response cannot corrupt the store. */
function clone(request: ServiceRequest): ServiceRequest {
  return { ...request }
}

function matchesSearch(request: ServiceRequest, search: string): boolean {
  const needle = search.trim().toLowerCase()
  return (
    request.title.toLowerCase().includes(needle) ||
    request.requesterName.toLowerCase().includes(needle)
  )
}

function compareBy(sort: SortExpression): (a: ServiceRequest, b: ServiceRequest) => number {
  const descending = sort.startsWith('-')
  const field = descending ? sort.slice(1) : sort
  const direction = descending ? -1 : 1

  return (a, b) => {
    switch (field) {
      case 'priority':
        return comparePriority(a.priority, b.priority) * direction
      case 'updatedAt':
        return a.updatedAt.localeCompare(b.updatedAt) * direction
      default:
        return a.createdAt.localeCompare(b.createdAt) * direction
    }
  }
}

export function listRequests(query: ListQuery): ServiceRequestPage {
  const matched = requests.filter((request) => {
    if (query.status !== undefined && request.status !== query.status) return false
    if (query.priority !== undefined && request.priority !== query.priority) return false
    if (
      query.search !== undefined &&
      query.search !== '' &&
      !matchesSearch(request, query.search)
    ) {
      return false
    }
    return true
  })

  const sorted = [...matched].sort(compareBy(query.sort))
  const offset = (query.page - 1) * query.pageSize

  return {
    items: sorted.slice(offset, offset + query.pageSize).map(clone),
    page: query.page,
    pageSize: query.pageSize,
    total: matched.length,
    totalPages: Math.ceil(matched.length / query.pageSize),
  }
}

export function findRequest(requestId: string): ServiceRequest | undefined {
  const found = requests.find((request) => request.id === requestId)
  return found === undefined ? undefined : clone(found)
}

export function createRequest(payload: CreateServiceRequest): ServiceRequest {
  const timestamp = now()
  const created: ServiceRequest = {
    id: `REQ-${nextId}`,
    title: payload.title,
    description: payload.description,
    category: payload.category,
    priority: payload.priority,
    status: 'OPEN',
    requesterName: payload.requesterName,
    requesterEmail: payload.requesterEmail,
    createdAt: timestamp,
    updatedAt: timestamp,
    version: 1,
  }

  nextId += 1
  requests = [...requests, created]
  return clone(created)
}

export function updateRequestStatus(requestId: string, update: StatusUpdate): StatusUpdateResult {
  const current = requests.find((request) => request.id === requestId)

  if (current === undefined) {
    return { outcome: 'not-found' }
  }

  if (current.version !== update.version) {
    return { outcome: 'conflict', current: clone(current) }
  }

  if (!canTransition(current.status, update.status)) {
    return { outcome: 'invalid-transition', from: current.status, to: update.status }
  }

  const updated: ServiceRequest = {
    ...current,
    status: update.status,
    updatedAt: now(),
    version: current.version + 1,
  }

  requests = requests.map((request) => (request.id === requestId ? updated : request))

  if (update.note !== undefined && update.note !== '') {
    transitionNotes = [
      ...transitionNotes,
      { requestId, note: update.note, recordedAt: updated.updatedAt },
    ]
  }

  return { outcome: 'updated', request: clone(updated) }
}

/**
 * The contract accepts a transition note but never returns it, so it is only
 * kept here to prove the payload reaches the API.
 */
export function readTransitionNotes(requestId: string): readonly string[] {
  return transitionNotes.filter((entry) => entry.requestId === requestId).map((entry) => entry.note)
}

/** Lets a test put a record in a known state without going through the API. */
export function replaceRequest(request: ServiceRequest): void {
  requests = requests.map((existing) => (existing.id === request.id ? { ...request } : existing))
}
