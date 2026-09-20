import { Outlet } from 'react-router'

import { RequireAuth } from './RequireAuth'

export function ProtectedRoutes() {
  return (
    <RequireAuth>
      <Outlet />
    </RequireAuth>
  )
}
