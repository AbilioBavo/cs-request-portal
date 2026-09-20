import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <div className="rounded-lg border border-border bg-surface p-8 text-center">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-ink-muted">
        The page you asked for does not exist in this portal.
      </p>
      <Link
        to="/requests"
        className="mt-4 inline-block text-sm font-medium text-brand underline underline-offset-2"
      >
        Back to service requests
      </Link>
    </div>
  )
}
