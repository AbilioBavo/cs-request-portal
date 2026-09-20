import { Link } from 'react-router'

import { CreateRequestForm } from '../components/CreateRequestForm'

export function CreateRequestPage() {
  return (
    <section aria-labelledby="create-request-heading" className="mx-auto max-w-2xl space-y-4">
      <Link
        to="/requests"
        className="text-sm font-medium text-brand underline-offset-2 hover:underline"
      >
        Back to results
      </Link>

      <header>
        <h1 id="create-request-heading" className="text-xl font-semibold">
          New service request
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          The server assigns the identifier, sets the status to Open and starts the version at 1.
          Title, description, category and priority cannot be edited afterwards.
        </p>
      </header>

      <div className="rounded-lg border border-border bg-surface p-4 sm:p-6">
        <CreateRequestForm />
      </div>
    </section>
  )
}
