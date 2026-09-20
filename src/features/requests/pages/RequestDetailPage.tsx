import { useParams } from 'react-router'

export function RequestDetailPage() {
  const { requestId } = useParams<{ requestId: string }>()

  return (
    <section aria-labelledby="request-heading">
      <h1 id="request-heading" className="text-xl font-semibold">
        {requestId}
      </h1>
    </section>
  )
}
