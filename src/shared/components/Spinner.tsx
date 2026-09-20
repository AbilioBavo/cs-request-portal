export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <span className="inline-flex items-center">
      <span
        aria-hidden="true"
        className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      />
      <span className="sr-only">{label}</span>
    </span>
  )
}
