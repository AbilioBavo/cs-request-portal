import { Navigate, createBrowserRouter } from 'react-router'

import { env } from '../shared/config/env'
import { AppLayout } from './AppLayout'
import { NotFoundPage } from './pages/NotFoundPage'

/**
 * Feature pages are code split so the first paint only carries the shell and
 * the list screen.
 */
export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <AppLayout />,
      children: [
        { index: true, element: <Navigate to="/requests" replace /> },
        {
          path: 'requests',
          lazy: async () => {
            const { RequestsListPage } = await import('../features/requests/pages/RequestsListPage')
            return { Component: RequestsListPage }
          },
        },
        {
          path: 'requests/:requestId',
          lazy: async () => {
            const { RequestDetailPage } =
              await import('../features/requests/pages/RequestDetailPage')
            return { Component: RequestDetailPage }
          },
        },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ],
  { basename: env.basePath },
)
