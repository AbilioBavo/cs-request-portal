import type { components, operations } from './schema'

export type ServiceRequest = components['schemas']['ServiceRequest']
export type ServiceRequestStatus = components['schemas']['ServiceRequestStatus']
export type ServiceRequestPriority = components['schemas']['ServiceRequestPriority']
export type ServiceRequestPage = components['schemas']['ServiceRequestPage']
export type CreateServiceRequest = components['schemas']['CreateServiceRequest']
export type UpdateServiceRequestStatus = components['schemas']['UpdateServiceRequestStatus']
export type ProblemDetails = components['schemas']['ProblemDetails']

export type ListRequestsQuery = NonNullable<operations['listServiceRequests']['parameters']['query']>
export type SortExpression = NonNullable<ListRequestsQuery['sort']>
