import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch, type UseFormSetError } from 'react-hook-form'
import { useNavigate } from 'react-router'

import { ApiProblem } from '../../../api/problem'
import { SERVICE_REQUEST_PRIORITIES } from '../../../api/enums'
import { Button } from '../../../shared/components/Button'
import { TextField } from '../../../shared/components/TextField'
import { useToast } from '../../../shared/toast/toast-context'
import { useCreateRequest } from '../api/mutations'
import { PRIORITY_LABELS } from '../model/labels'
import {
  CATEGORY_SUGGESTIONS,
  createRequestSchema,
  isCreateRequestField,
  type CreateRequestInput,
} from '../model/schemas'

function applyServerErrors(
  problem: ApiProblem,
  setError: UseFormSetError<CreateRequestInput>,
): void {
  for (const [field, messages] of Object.entries(problem.fieldErrors ?? {})) {
    if (isCreateRequestField(field)) {
      setError(field, { type: 'server', message: messages.join(' ') })
    }
  }
}

export function CreateRequestForm() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const createRequest = useCreateRequest()

  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CreateRequestInput>({
    resolver: zodResolver(createRequestSchema),
    mode: 'onBlur',
    defaultValues: {
      title: '',
      description: '',
      category: '',
      priority: 'MEDIUM',
      requesterName: '',
      requesterEmail: '',
    },
  })

  const title = useWatch({ control, name: 'title' })
  const description = useWatch({ control, name: 'description' })
  const category = useWatch({ control, name: 'category' })
  const requesterName = useWatch({ control, name: 'requesterName' })

  async function onSubmit(values: CreateRequestInput): Promise<void> {
    try {
      const created = await createRequest.mutateAsync(values)
      showToast({
        tone: 'success',
        title: 'Service request created',
        description: `${created.id} is now open.`,
      })
      void navigate(`/requests/${created.id}`, { replace: true })
    } catch (error) {
      const problem = ApiProblem.fromUnknown(error)

      if (problem.isValidationFailure) {
        applyServerErrors(problem, setError)
        const firstInvalid = Object.keys(problem.fieldErrors ?? {}).find(isCreateRequestField)
        if (firstInvalid !== undefined) {
          setFocus(firstInvalid)
        }
        return
      }

      showToast({
        tone: 'error',
        title: problem.title,
        description: problem.detail,
        traceId: problem.traceId,
      })
    }
  }

  return (
    <form className="space-y-4" noValidate onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
      <TextField
        id="title"
        label="Title"
        required
        maxLength={120}
        currentLength={title.length}
        error={errors.title?.message}
        registration={register('title')}
      />

      <TextField
        id="description"
        label="Description"
        required
        multiline
        rows={6}
        maxLength={2000}
        currentLength={description.length}
        hint="Describe what is happening, who is affected and when it started."
        error={errors.description?.message}
        registration={register('description')}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="category"
          label="Category"
          required
          list="category-suggestions"
          maxLength={50}
          currentLength={category.length}
          hint="A short classification such as Access or Billing."
          error={errors.category?.message}
          registration={register('category')}
        />

        <datalist id="category-suggestions">
          {CATEGORY_SUGGESTIONS.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>

        <div>
          <label htmlFor="priority" className="block text-xs font-medium text-ink-muted">
            Priority <span aria-hidden="true">*</span>
            <span className="sr-only"> (required)</span>
          </label>
          <select
            id="priority"
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink shadow-xs aria-invalid:border-danger"
            aria-invalid={errors.priority !== undefined}
            aria-required
            {...register('priority')}
          >
            {SERVICE_REQUEST_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {PRIORITY_LABELS[priority]}
              </option>
            ))}
          </select>
          {errors.priority !== undefined && (
            <p role="alert" className="mt-1 text-xs font-medium text-danger">
              {errors.priority.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="requesterName"
          label="Requester name"
          required
          maxLength={100}
          currentLength={requesterName.length}
          error={errors.requesterName?.message}
          registration={register('requesterName')}
        />

        <TextField
          id="requesterEmail"
          label="Requester email"
          required
          type="email"
          maxLength={254}
          error={errors.requesterEmail?.message}
          registration={register('requesterEmail')}
        />
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            if (isDirty && !window.confirm('Discard this request? Unsaved changes will be lost.')) {
              return
            }
            void navigate('/requests')
          }}
        >
          Cancel
        </Button>

        <Button type="submit" isLoading={isSubmitting}>
          Create request
        </Button>
      </div>
    </form>
  )
}
