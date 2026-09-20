import type { ReactNode } from 'react'

export interface EmptyStateProps {
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-surface p-8 text-center">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">{description}</p>
      {action !== undefined && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}
