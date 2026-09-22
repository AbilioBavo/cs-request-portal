export function RequestsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div
      aria-hidden="true"
      className="space-y-2 rounded-xl border border-border bg-surface p-4 shadow-soft"
      data-testid="requests-skeleton"
    >
      {Array.from({ length: rows }, (_unused, index) => (
        <div key={index} className="h-12 animate-pulse rounded bg-surface-muted" />
      ))}
    </div>
  )
}
