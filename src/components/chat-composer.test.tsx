import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { ChatStatus } from 'ai'
import { TooltipProvider } from '../ui/tooltip'
import { ChatComposer, type ChatSubmitMode } from './chat-composer'

interface RenderOptions {
  value?: string
  status?: ChatStatus
  disclaimer?: string
  submitMode?: ChatSubmitMode
  onSend?: (text: string) => void | Promise<void>
}

function renderComposer({
  value = '',
  status = 'ready',
  disclaimer,
  submitMode = 'enter',
  onSend = vi.fn(),
}: RenderOptions = {}) {
  const onStop = vi.fn()
  const onChange = vi.fn()

  render(
    <TooltipProvider>
      <ChatComposer
        value={value}
        onChange={onChange}
        onSend={onSend}
        onStop={onStop}
        status={status}
        disclaimer={disclaimer}
        submitMode={submitMode}
      />
    </TooltipProvider>,
  )

  return { onSend, onStop, onChange }
}

describe('ChatComposer', () => {
  it('sends trimmed text on Enter', async () => {
    const user = userEvent.setup()
    const { onSend } = renderComposer({ value: '  hello assistant  ' })

    await user.type(screen.getByLabelText('Message the assistant'), '{Enter}')
    expect(onSend).toHaveBeenCalledExactlyOnceWith('hello assistant')
  })

  it('does not send on Shift+Enter', async () => {
    const user = userEvent.setup()
    const { onSend } = renderComposer({ value: 'line one' })

    await user.type(
      screen.getByLabelText('Message the assistant'),
      '{Shift>}{Enter}{/Shift}',
    )
    expect(onSend).not.toHaveBeenCalled()
  })

  it('supports modifier-enter submission', async () => {
    const user = userEvent.setup()
    const { onSend } = renderComposer({
      value: 'send with modifier',
      submitMode: 'mod-enter',
    })

    const textarea = screen.getByLabelText('Message the assistant')
    await user.type(textarea, '{Enter}')
    expect(onSend).not.toHaveBeenCalled()

    await user.type(textarea, '{Control>}{Enter}{/Control}')
    expect(onSend).toHaveBeenCalledExactlyOnceWith('send with modifier')
  })

  it('disables send for empty input', () => {
    renderComposer()
    expect(screen.getByLabelText('Send message')).toBeDisabled()
  })

  it('ignores Enter while a response is in flight', async () => {
    const user = userEvent.setup()
    const { onSend } = renderComposer({ value: 'queued', status: 'streaming' })

    await user.type(screen.getByLabelText('Message the assistant'), '{Enter}')
    expect(onSend).not.toHaveBeenCalled()
  })

  it('shows a working stop button while streaming', async () => {
    const user = userEvent.setup()
    const { onStop } = renderComposer({ status: 'streaming' })

    expect(screen.queryByLabelText('Send message')).not.toBeInTheDocument()
    await user.click(screen.getByLabelText('Stop generating'))
    expect(onStop).toHaveBeenCalledOnce()
  })

  it('does not reference a missing disclaimer description', () => {
    renderComposer({ disclaimer: '' })
    expect(screen.getByLabelText('Message the assistant')).not.toHaveAttribute(
      'aria-describedby',
    )
  })

  it('locks duplicate submits until the pending send settles', async () => {
    const user = userEvent.setup()
    let resolveSend: (() => void) | undefined
    const onSend = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSend = resolve
        }),
    )
    renderComposer({ value: 'only once', onSend })

    const textarea = screen.getByLabelText('Message the assistant')
    await user.type(textarea, '{Enter}{Enter}')
    expect(onSend).toHaveBeenCalledOnce()

    resolveSend?.()
  })
})
