import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { UIMessage } from 'ai'
import { ChatMessageList } from './chat-message-list'

const scrollToEnd = vi.fn()

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    scrollToEnd,
    getTotalSize: () => count * 100,
    getVirtualItems: () =>
      Array.from({ length: count }, (_, index) => ({
        index,
        key: index,
        start: index * 100,
      })),
    measureElement: vi.fn(),
    isAtEnd: () => true,
  }),
}))

const messages: UIMessage[] = [
  {
    id: 'user-1',
    role: 'user',
    parts: [{ type: 'text', text: 'Hello' }],
  },
]

describe('ChatMessageList', () => {
  beforeEach(() => {
    scrollToEnd.mockClear()
  })

  it('keeps live announcements outside the virtualized transcript', () => {
    render(<ChatMessageList messages={messages} status="streaming" />)

    const transcript = screen.getByRole('region', { name: 'Chat messages' })
    expect(transcript).not.toHaveAttribute('aria-live')
    expect(transcript).not.toHaveAttribute('role', 'log')
    expect(transcript).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Assistant is responding.')).toHaveAttribute(
      'aria-live',
      'polite',
    )
  })

  it('announces submitted state without making virtual rows live', () => {
    render(<ChatMessageList messages={messages} status="submitted" />)

    expect(screen.getByText('Assistant is thinking.')).toHaveAttribute(
      'aria-live',
      'polite',
    )
    expect(screen.getByRole('region', { name: 'Chat messages' })).not.toHaveAttribute(
      'aria-live',
    )
  })
})
