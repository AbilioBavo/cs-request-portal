import { act, render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ToastProvider } from './ToastProvider'
import { useToast, type ToastInput } from './toast-context'

function setup() {
  const view = renderHook(() => useToast(), { wrapper: ToastProvider })
  return {
    show: (input: ToastInput) => {
      act(() => {
        view.result.current.showToast(input)
      })
    },
  }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('ToastProvider', () => {
  it('announces a success politely and retires it on its own', () => {
    vi.useFakeTimers()
    const { show } = setup()

    show({ tone: 'success', title: 'Request created' })
    expect(screen.getByRole('status')).toHaveTextContent('Request created')

    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(screen.queryByText('Request created')).not.toBeInTheDocument()
  })

  it('keeps a failure on screen with its trace id so it can be quoted', () => {
    vi.useFakeTimers()
    const { show } = setup()

    show({ tone: 'error', title: 'Update failed', traceId: 'trace-77' })

    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Update failed')
    expect(alert).toHaveTextContent('Trace trace-77')
  })

  it('runs the offered action and closes the toast', async () => {
    const onAction = vi.fn()
    const { show } = setup()

    show({ tone: 'error', title: 'Update failed', action: { label: 'Retry', onAction } })
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))

    expect(onAction).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('can be dismissed by hand', async () => {
    const { show } = setup()

    show({ tone: 'error', title: 'Update failed', description: 'Try again in a moment' })
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }))

    expect(screen.queryByText('Update failed')).not.toBeInTheDocument()
  })

  it('shows at most three notifications, dropping the oldest', () => {
    const { show } = setup()

    for (const title of ['First', 'Second', 'Third', 'Fourth']) {
      show({ tone: 'error', title })
    }

    expect(screen.queryByText('First')).not.toBeInTheDocument()
    expect(screen.getAllByRole('alert')).toHaveLength(3)
  })

  it('refuses to work outside the provider', () => {
    function Consumer() {
      useToast()
      return null
    }

    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    expect(() => render(<Consumer />)).toThrow(/must be used inside a ToastProvider/)
  })
})
