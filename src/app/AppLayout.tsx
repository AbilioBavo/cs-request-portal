import { Outlet } from 'react-router'

import { AppHeader } from './AppHeader'

export function AppLayout() {
  return (
    <div className="min-h-dvh">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:shadow"
      >
        Skip to main content
      </a>

      <AppHeader />

      <main id="main-content" className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
