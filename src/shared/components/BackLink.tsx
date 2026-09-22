import { Link, type To } from 'react-router'

export interface BackLinkProps {
  to: To
  children?: string
}

/**
 * Shared “leave this screen” control. The arrow is decorative; the link name
 * stays the visible text so existing tests and screen readers keep working.
 */
export function BackLink({ to, children = 'Back to results' }: BackLinkProps) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-brand transition-colors hover:text-brand-strong"
    >
      <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className="size-3.5 shrink-0">
        <path
          d="M10 3 5 8l5 5"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {children}
    </Link>
  )
}
