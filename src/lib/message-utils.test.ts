import { describe, expect, it } from 'vitest'
import type { UIMessage } from 'ai'
import { getConversationTranscript, getMessageText } from './message-utils'

const messages: UIMessage[] = [
  {
    id: 'user-1',
    role: 'user',
    parts: [{ type: 'text', text: 'Help me train.' }],
  },
  {
    id: 'assistant-1',
    role: 'assistant',
    parts: [
      { type: 'text', text: 'Start with ' },
      { type: 'step-start' },
      { type: 'text', text: 'three sessions.' },
    ],
  },
  {
    id: 'assistant-2',
    role: 'assistant',
    // Tool-only message: contributes no transcript text.
    parts: [{ type: 'step-start' }],
  },
]

describe('getMessageText', () => {
  it('joins text parts in order and skips non-text parts', () => {
    expect(getMessageText(messages[1]!)).toBe('Start with three sessions.')
  })

  it('returns an empty string when a message has no text parts', () => {
    expect(getMessageText(messages[2]!)).toBe('')
  })
})

describe('getConversationTranscript', () => {
  it('builds a readable transcript and drops empty messages', () => {
    expect(getConversationTranscript(messages)).toBe(
      'You:\nHelp me train.\n\nAssistant:\nStart with three sessions.',
    )
  })

  it('supports product-specific speaker labels', () => {
    expect(
      getConversationTranscript(messages, {
        userLabel: 'Athlete',
        assistantLabel: 'Coach',
      }),
    ).toBe(
      'Athlete:\nHelp me train.\n\nCoach:\nStart with three sessions.',
    )
  })
})
