import { Spinner } from './Spinner'

export function FullPageStatus({ label }: { label: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-ink-muted">
      <Spinner label={label} />
      <p aria-hidden="true" className="text-sm">
        {label}
      </p>
    </div>
  )
}
