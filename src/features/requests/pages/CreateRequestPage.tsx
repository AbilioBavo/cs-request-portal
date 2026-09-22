import { BackLink } from '../../../shared/components/BackLink'
import { CreateRequestForm } from '../components/CreateRequestForm'

export function CreateRequestPage() {
  return (
    <section aria-labelledby="create-request-heading" className="mx-auto max-w-2xl space-y-5">
      <BackLink to="/requests" />

      <header>
        <h1 id="create-request-heading" className="text-2xl font-semibold tracking-tight">
          New service request
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
          The server assigns the identifier, sets the status to Open and starts the version at 1.
          Title, description, category and priority cannot be edited afterwards.
        </p>
      </header>

      <div className="rounded-xl border border-border bg-surface p-5 shadow-soft sm:p-6">
        <CreateRequestForm />
      </div>
    </section>
  )
}
