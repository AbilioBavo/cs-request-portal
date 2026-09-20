import type { UseFormRegisterReturn } from 'react-hook-form'

export interface TextFieldProps {
  id: string
  label: string
  registration: UseFormRegisterReturn
  hint?: string | undefined
  error?: string | undefined
  required?: boolean
  multiline?: boolean
  rows?: number
  type?: 'text' | 'email'
  maxLength?: number | undefined
  currentLength?: number | undefined
  /** Id of a datalist with suggestions, for free-text fields with common values. */
  list?: string | undefined
}

const CONTROL_CLASSES =
  'mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink shadow-xs aria-invalid:border-danger'

export function TextField({
  id,
  label,
  registration,
  hint,
  error,
  required = false,
  multiline = false,
  rows = 4,
  type = 'text',
  maxLength,
  currentLength,
  list,
}: TextFieldProps) {
  const hintId = hint === undefined ? undefined : `${id}-hint`
  const errorId = error === undefined ? undefined : `${id}-error`
  const describedBy = [hintId, errorId].filter((value) => value !== undefined).join(' ')

  const shared = {
    id,
    'aria-invalid': error !== undefined,
    'aria-required': required,
    'aria-describedby': describedBy === '' ? undefined : describedBy,
    className: CONTROL_CLASSES,
    maxLength,
    ...registration,
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="block text-xs font-medium text-ink-muted">
          {label}
          {required && (
            <>
              <span aria-hidden="true"> *</span>
              <span className="sr-only"> (required)</span>
            </>
          )}
        </label>

        {maxLength !== undefined && currentLength !== undefined && (
          <span className="text-xs text-ink-muted">
            {currentLength}/{maxLength}
          </span>
        )}
      </div>

      {multiline ? (
        <textarea rows={rows} {...shared} />
      ) : (
        <input type={type} list={list} {...shared} />
      )}

      {hint !== undefined && (
        <p id={hintId} className="mt-1 text-xs text-ink-muted">
          {hint}
        </p>
      )}

      {error !== undefined && (
        <p id={errorId} role="alert" className="mt-1 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
