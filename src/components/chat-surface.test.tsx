import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '../ui/tooltip'
import { ChatSurface } from './chat-surface'

describe('ChatSurface', () => {
  it('clears optimistically and restores a draft when send rejects', async () => {
    const user = userEvent.setup()
    const onDraftChange = vi.fn()
    const onSend = vi.fn().mockRejectedValue(new Error('offline'))

    render(
      <TooltipProvider>
        <ChatSurface
          messages={[]}
          status="ready"
          draft="  hello coach  "
          onDraftChange={onDraftChange}
          onSend={onSend}
          onStop={vi.fn()}
          onRegenerate={vi.fn()}
        />
      </TooltipProvider>,
    )

    await user.type(
      screen.getByLabelText('Message the assistant'),
      '{Enter}',
    )

    expect(onSend).toHaveBeenCalledExactlyOnceWith('hello coach')
    await waitFor(() => {
      expect(onDraftChange).toHaveBeenNthCalledWith(1, '')
      expect(onDraftChange).toHaveBeenNthCalledWith(2, 'hello coach')
    })
  })
})
