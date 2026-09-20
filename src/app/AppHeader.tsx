import { Link } from 'react-router'

import { SignOutButton } from '../auth/SignOutButton'
import { useAuthSession } from '../auth/session'

export function AppHeader() {
  const { isAuthenticated, displayName, email } = useAuthSession()

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link to="/requests" className="text-base font-semibold">
          Service Request Portal
        </Link>

        {isAuthenticated && (
          <div className="flex items-center gap-3">
            <span className="text-right text-sm leading-tight">
              <span className="block font-medium">{displayName}</span>
              {email !== undefined && <span className="block text-xs text-ink-muted">{email}</span>}
            </span>
            <SignOutButton />
          </div>
        )}
      </div>
    </header>
  )
}
