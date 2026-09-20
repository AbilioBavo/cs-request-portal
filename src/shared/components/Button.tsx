import type { ButtonHTMLAttributes } from 'react'

import { Spinner } from './Spinner'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

const BASE_CLASSES =
  'inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60'

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-strong',
  secondary: 'border border-border bg-surface text-ink hover:bg-surface-muted',
  ghost: 'text-ink-muted hover:bg-surface-muted hover:text-ink',
  danger: 'bg-danger text-white hover:brightness-90',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  isLoading?: boolean
}

export function Button({
  variant = 'primary',
  isLoading = false,
  type = 'button',
  className = '',
  disabled = false,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      className={`${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    >
      {isLoading && <Spinner label="Working" />}
      {children}
    </button>
  )
}
