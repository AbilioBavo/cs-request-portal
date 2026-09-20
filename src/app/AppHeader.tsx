import { Link } from 'react-router'

export function AppHeader() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link to="/requests" className="text-base font-semibold">
          Service Request Portal
        </Link>
      </div>
    </header>
  )
}
