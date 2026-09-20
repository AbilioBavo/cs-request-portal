import { Component, type ErrorInfo, type ReactNode } from 'react'

import { ErrorState } from '../shared/components/ErrorState'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: unknown
}

/**
 * Last line of defence for render-time failures. Data fetching errors are
 * handled inline by the feature that owns the query.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unhandled render error', error, info.componentStack)
  }

  override render(): ReactNode {
    if (this.state.error !== null) {
      return (
        <div className="mx-auto max-w-2xl p-6">
          <ErrorState
            title="Something went wrong"
            error={this.state.error}
            onRetry={() => {
              window.location.reload()
            }}
          />
        </div>
      )
    }

    return this.props.children
  }
}
