import { useCallback, useEffect, useRef, type ReactNode } from 'react'
import type { ChatStatus, UIMessage } from 'ai'
import { useCopyFeedback } from '../hooks/use-copy-feedback'
import { cn } from '../lib/utils'
import { getConversationTranscript } from '../lib/message-utils'
import type {
  ChatAssistantIdentity,
  ChatToolApprovalHandler,
} from '../types'
import {
  ChatComposer,
  type ChatSubmitMode,
} from './chat-composer'
import { ChatEmptyState, type ChatSuggestion } from './chat-empty-state'
import { ChatError } from './chat-error'
import { ChatHeader } from './chat-header'
import {
  ChatMessageList,
  type ChatMessageListProps,
} from './chat-message-list'
import type { ChatPartRenderer } from './chat-message'
import { ChatUiProvider } from './chat-ui-provider'

export interface ChatSurfaceProps {
  messages: UIMessage[]
  status: ChatStatus
  error?: Error
  draft: string
  onDraftChange: (value: string) => void
  onSend: (text: string) => void | Promise<void>
  onStop?: () => void
  onRegenerate?: (messageId?: string) => void | Promise<void>
  onRetry?: () => void | Promise<void>
  onToolApproval?: ChatToolApprovalHandler
  onClearError?: () => void
  onNewChat?: () => void
  hasOlder?: boolean
  onLoadOlder?: ChatMessageListProps['onLoadOlder']
  isLoadingOlder?: boolean
  renderPart?: ChatPartRenderer
  showToolDetails?: boolean
  assistant?: Partial<ChatAssistantIdentity>
  userLabel?: string
  suggestions?: ChatSuggestion[]
  emptyStateTitle?: string
  emptyStateDescription?: string
  emptyStateIcon?: ReactNode
  composerPlaceholder?: string
  composerAriaLabel?: string
  composerDisclaimer?: string
  composerSubmitMode?: ChatSubmitMode
  composerFooterStart?: ReactNode
  errorTitle?: string
  errorMessage?: string
  messageListClassName?: ChatMessageListProps['className']
  className?: string
}

/**
 * Fully controlled, reusable chat page. Transport, persistence, and history
 * live outside; this component owns presentation, keyboard, scroll, and copy.
 */
export function ChatSurface({
  messages,
  status,
  error,
  draft,
  onDraftChange,
  onSend,
  onStop,
  onRegenerate,
  onRetry,
  onToolApproval,
  onClearError,
  onNewChat,
  hasOlder,
  onLoadOlder,
  isLoadingOlder,
  renderPart,
  showToolDetails,
  assistant,
  userLabel = 'You',
  suggestions,
  emptyStateTitle,
  emptyStateDescription,
  emptyStateIcon,
  composerPlaceholder,
  composerAriaLabel,
  composerDisclaimer,
  composerSubmitMode,
  composerFooterStart,
  errorTitle,
  errorMessage,
  messageListClassName,
  className,
}: ChatSurfaceProps) {
  const { copied, copy } = useCopyFeedback()
  const draftRef = useRef(draft)
  const sendInFlightRef = useRef(false)

  useEffect(() => {
    draftRef.current = draft
  }, [draft])
  const hasMessages = messages.length > 0
  const assistantName = assistant?.name ?? 'Assistant'

  const handleDraftChange = useCallback(
    (value: string) => {
      draftRef.current = value
      onDraftChange(value)
    },
    [onDraftChange],
  )

  const handleSend = useCallback(
    async (text: string) => {
      if (sendInFlightRef.current) return

      sendInFlightRef.current = true
      draftRef.current = ''
      onDraftChange('')

      try {
        await onSend(text)
      } catch (sendError) {
        // Never overwrite a new draft the user started while the request was
        // in flight. Restore only when the composer is still empty.
        if (draftRef.current.length === 0) {
          draftRef.current = text
          onDraftChange(text)
        }
        throw sendError
      } finally {
        sendInFlightRef.current = false
      }
    },
    [onDraftChange, onSend],
  )

  const handleCopyConversation = async () => {
    await copy(
      getConversationTranscript(messages, {
        assistantLabel: assistantName,
        userLabel,
      }),
    )
  }

  return (
    <ChatUiProvider>
      <section
        className={cn(
          'raic-root raic-surface flex h-full min-h-0 flex-col overflow-hidden text-foreground',
          className,
        )}
      >
      <ChatHeader
        status={status}
        hasMessages={hasMessages}
        copied={copied}
        assistant={assistant}
        onCopyConversation={
          hasMessages ? () => void handleCopyConversation() : undefined
        }
        onNewChat={hasMessages ? onNewChat : undefined}
      />

      {hasMessages ? (
        <ChatMessageList
          messages={messages}
          status={status}
          assistant={assistant}
          userLabel={userLabel}
          onRegenerate={
            onRegenerate
              ? (messageId) =>
                  void Promise.resolve(onRegenerate(messageId)).catch(
                    () => undefined,
                  )
              : undefined
          }
          onToolApproval={onToolApproval}
          renderPart={renderPart}
          showToolDetails={showToolDetails}
          hasOlder={hasOlder}
          onLoadOlder={onLoadOlder}
          isLoadingOlder={isLoadingOlder}
          className={messageListClassName}
        />
      ) : (
        <ChatEmptyState
          suggestions={suggestions}
          title={emptyStateTitle}
          description={emptyStateDescription}
          icon={emptyStateIcon ?? assistant?.avatar}
          onSuggestion={(prompt) =>
            void handleSend(prompt).catch(() => undefined)
          }
        />
      )}

      {error && (
        <div className="shrink-0 pb-2">
          <ChatError
            title={errorTitle}
            message={errorMessage}
            onRetry={
              onRetry
                ? () =>
                    void Promise.resolve(onRetry()).catch(() => undefined)
                : undefined
            }
            onDismiss={onClearError}
          />
        </div>
      )}

      <div className="shrink-0 bg-gradient-to-t from-background via-background to-transparent pt-2">
        <ChatComposer
          value={draft}
          onChange={handleDraftChange}
          onSend={handleSend}
          onStop={onStop}
          status={status}
          placeholder={composerPlaceholder}
          ariaLabel={
            composerAriaLabel ?? `Message the ${assistantName.toLowerCase()}`
          }
          disclaimer={composerDisclaimer}
          submitMode={composerSubmitMode}
          footerStart={composerFooterStart}
        />
      </div>
      </section>
    </ChatUiProvider>
  )
}
