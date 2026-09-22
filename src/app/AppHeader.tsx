import { Link } from 'react-router'

import { SignOutButton } from '../auth/SignOutButton'
import { useAuthSession } from '../auth/session'

export function AppHeader() {
  const { isAuthenticated, displayName, email } = useAuthSession()

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
        <Link
          to="/requests"
          className="text-[0.95rem] font-semibold tracking-tight text-ink transition-colors hover:text-brand"
        >
          Customer Service Request Portal
        </Link>

        {isAuthenticated && (
          <div className="flex items-center gap-3">
            <span className="hidden text-right text-sm leading-tight sm:block">
              <span className="block font-medium tracking-tight">{displayName}</span>
              {email !== undefined && <span className="block text-xs text-ink-muted">{email}</span>}
            </span>
            <SignOutButton />
          </div>
        )}
      </div>
    </header>
  )
}
