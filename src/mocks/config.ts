/**
 * Artificial latency makes loading states visible while developing. Tests keep
 * it at zero so they stay fast and deterministic.
 */
export const mockLatency = { ms: 0 }

export function setMockLatency(ms: number): void {
  mockLatency.ms = ms
}
