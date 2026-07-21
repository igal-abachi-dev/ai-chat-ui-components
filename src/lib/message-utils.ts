import type { UIMessage } from 'ai'

/** Flatten a UI message's visible text parts in display order. */
export function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('')
}

export interface ConversationTranscriptOptions {
  userLabel?: string
  assistantLabel?: string
}

/** Plain-text transcript for copy/export actions. */
export function getConversationTranscript(
  messages: UIMessage[],
  {
    userLabel = 'You',
    assistantLabel = 'Assistant',
  }: ConversationTranscriptOptions = {},
): string {
  return messages
    .filter((message) => message.role !== 'system')
    .map((message) => ({
      speaker: message.role === 'user' ? userLabel : assistantLabel,
      text: getMessageText(message).trim(),
    }))
    .filter(({ text }) => text.length > 0)
    .map(({ speaker, text }) => `${speaker}:\n${text}`)
    .join('\n\n')
}
