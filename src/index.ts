import './styles.css'
//export { createCoachChatTransport, COACH_CHAT_PATH } from './api/chat-transport'
export { ChatComposer } from './components/chat-composer'
export type {
  ChatComposerProps,
  ChatSubmitMode,
} from './components/chat-composer'
export { ChatEmptyState } from './components/chat-empty-state'
export type {
  ChatEmptyStateProps,
  ChatSuggestion,
} from './components/chat-empty-state'
export { ChatError } from './components/chat-error'
export type { ChatErrorProps } from './components/chat-error'
export { ChatHeader } from './components/chat-header'
export type { ChatHeaderProps } from './components/chat-header'
export { ChatMarkdown } from './components/chat-markdown'
export type { ChatMarkdownProps } from './components/chat-markdown'
export { ChatMessage } from './components/chat-message'
export type {
  ChatMessagePart,
  ChatMessageProps,
  ChatPartRenderer,
  ChatPartRenderContext,
} from './components/chat-message'
export { ChatMessageList } from './components/chat-message-list'
export type {
  ChatMessageListHandle,
  ChatMessageListProps,
} from './components/chat-message-list'
export { ChatSurface } from './components/chat-surface'
export type { ChatSurfaceProps } from './components/chat-surface'
export { ChatUiProvider } from './components/chat-ui-provider'
export type { ChatUiProviderProps } from './components/chat-ui-provider'
export { TypingIndicator } from './components/typing-indicator'
export type { TypingIndicatorProps } from './components/typing-indicator'
export { useCopyFeedback } from './hooks/use-copy-feedback'
export { copyText } from './lib/clipboard'
export {
  getConversationTranscript,
  getMessageText,
} from './lib/message-utils'
export type { ConversationTranscriptOptions } from './lib/message-utils'
export {
  getSafeLinkUrl,
  getSafeResourceUrl,
} from './lib/safe-url'
export type {
  ChatAssistantIdentity,
  ChatRole,
  ChatToolApproval,
  ChatToolApprovalHandler,
  Conversation,
} from './types'
