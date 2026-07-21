import { render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { UIMessage } from 'ai'
import { TooltipProvider } from '../ui/tooltip'
import { ChatMessage } from './chat-message'

function renderMessage(
  message: UIMessage,
  props: Omit<ComponentProps<typeof ChatMessage>, 'message'> = {},
) {
  return render(
    <TooltipProvider>
      <ChatMessage message={message} {...props} />
    </TooltipProvider>,
  )
}

describe('ChatMessage', () => {
  it('renders user text as plain content with automatic direction', () => {
    renderMessage({
      id: 'user-1',
      role: 'user',
      parts: [{ type: 'text', text: '**not bold**' }],
    })

    expect(screen.getByLabelText('You')).toHaveTextContent('**not bold**')
    expect(screen.queryByRole('strong')).not.toBeInTheDocument()
  })

  it('renders assistant GFM and safe external links', () => {
    renderMessage({
      id: 'assistant-1',
      role: 'assistant',
      parts: [
        {
          type: 'text',
          text: '**Strong** [source](https://example.com)',
        },
      ],
    })

    expect(screen.getByText('Strong')).toHaveAttribute(
      'data-streamdown',
      'strong',
    )
    const link = screen.getByRole('link', { name: 'source' })
    expect(link).toHaveAttribute('rel', 'noreferrer noopener')
    expect(link).not.toHaveAttribute('node')
    expect(screen.getByText('Strong').closest('p')).not.toHaveAttribute('node')
  })

  it('lets the user approve or deny tool execution', async () => {
    const user = userEvent.setup()
    const onToolApproval = vi.fn()

    renderMessage(
      {
        id: 'assistant-approval',
        role: 'assistant',
        parts: [
          {
            type: 'dynamic-tool',
            toolName: 'changeTrainingPlan',
            toolCallId: 'tool-approval-1',
            state: 'approval-requested',
            input: { days: 4 },
            approval: { id: 'approval-1' },
          },
        ],
      },
      { onToolApproval },
    )

    await user.click(screen.getByRole('button', { name: 'Approve' }))
    expect(onToolApproval).toHaveBeenCalledExactlyOnceWith({
      approvalId: 'approval-1',
      approved: true,
    })
  })

  it('blocks unsafe source and attachment URLs', () => {
    renderMessage({
      id: 'assistant-unsafe-resources',
      role: 'assistant',
      parts: [
        {
          type: 'source-url',
          sourceId: 'source-unsafe',
          url: 'javascript:alert(1)',
          title: 'Untrusted source',
        },
        {
          type: 'file',
          mediaType: 'image/svg+xml',
          filename: 'unsafe.svg',
          url: 'data:image/svg+xml,<svg onload=alert(1)/>',
        },
      ],
    })

    expect(screen.getByText('Untrusted source')).not.toHaveRole('link')
    expect(screen.getByText('Link blocked')).toBeVisible()
    expect(screen.queryByRole('img', { name: 'unsafe.svg' })).not.toBeInTheDocument()
  })

  it('shows a retryable inline error when tool approval fails', async () => {
    const user = userEvent.setup()
    const onToolApproval = vi.fn().mockRejectedValue(new Error('offline'))

    renderMessage(
      {
        id: 'assistant-approval-error',
        role: 'assistant',
        parts: [
          {
            type: 'dynamic-tool',
            toolName: 'changeTrainingPlan',
            toolCallId: 'tool-approval-error',
            state: 'approval-requested',
            input: { days: 4 },
            approval: { id: 'approval-error' },
          },
        ],
      },
      { onToolApproval },
    )

    await user.click(screen.getByRole('button', { name: 'Approve' }))
    expect(
      await screen.findByText('Could not submit that decision. Please try again.'),
    ).toHaveRole('alert')
    expect(screen.getByRole('button', { name: 'Approve' })).toBeEnabled()
  })

  it('renders a generic tool status without exposing details by default', () => {
    renderMessage({
      id: 'assistant-tool',
      role: 'assistant',
      parts: [
        {
          type: 'dynamic-tool',
          toolName: 'buildWorkout',
          toolCallId: 'tool-1',
          state: 'output-available',
          input: { days: 3 },
          output: { result: 'ok' },
        },
      ],
    })

    expect(screen.getByText('Build Workout')).toBeVisible()
    expect(screen.getByText('Done')).toBeVisible()
    expect(screen.queryByText('Input')).not.toBeInTheDocument()
  })
})
