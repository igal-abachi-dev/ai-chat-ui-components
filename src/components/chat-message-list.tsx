import {
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type Ref,
  type UIEvent,
} from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { ChatStatus, UIMessage } from 'ai'
import { ArrowDown, LoaderCircle } from 'lucide-react'
import { Button } from '../ui/button'
import { cn } from '../lib/utils'
import type {
  ChatAssistantIdentity,
  ChatToolApprovalHandler,
} from '../types'
import {
  ChatMessage,
  type ChatPartRenderer,
} from './chat-message'
import { TypingIndicator } from './typing-indicator'

export interface ChatMessageListHandle {
  scrollToEnd: (behavior?: ScrollBehavior) => void
}

export interface ChatMessageListProps {
  messages: UIMessage[]
  status: ChatStatus
  assistant?: Partial<ChatAssistantIdentity>
  userLabel?: string
  onRegenerate?: (messageId: string) => void | Promise<void>
  onToolApproval?: ChatToolApprovalHandler
  renderPart?: ChatPartRenderer
  showToolDetails?: boolean
  /** Enables the top-of-list history callback. */
  hasOlder?: boolean
  /** Return false when no rows were added so another attempt may be made. */
  onLoadOlder?: () => boolean | void | Promise<boolean | void>
  isLoadingOlder?: boolean
  className?: string
  ref?: Ref<ChatMessageListHandle>
}

const TYPING_ROW_KEY = '__assistant_typing_row__'
const END_THRESHOLD = 100
const LOAD_OLDER_THRESHOLD = 160

/**
 * Dynamic, end-anchored chat virtualization for streaming AI messages.
 * Stable ids preserve measurements through prepends; a real typing row covers
 * the submitted→first-token gap; block translation keeps smooth jumps stable
 * with dynamically measured rows.
 */
export function ChatMessageList({
  messages,
  status,
  assistant,
  userLabel,
  onRegenerate,
  onToolApproval,
  renderPart,
  showToolDetails = false,
  hasOlder = false,
  onLoadOlder,
  isLoadingOlder = false,
  className,
  ref,
}: ChatMessageListProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const didInitialScrollRef = useRef(false)
  const loadOlderInFlightRef = useRef(false)
  const requestedFirstIdRef = useRef<string | undefined>(undefined)

  const assistantName = assistant?.name ?? 'Assistant'
  const showTyping = status === 'submitted'
  const rowCount = messages.length + (showTyping ? 1 : 0)
  const lastMessage = messages.at(-1)
  const firstMessageId = messages[0]?.id
  const streamingMessageId =
    status === 'streaming' && lastMessage?.role === 'assistant'
      ? lastMessage.id
      : null
  const regenerateTargetId =
    status === 'ready' && lastMessage?.role === 'assistant' && onRegenerate
      ? lastMessage.id
      : null

  // TanStack Virtual exposes imperative state by design; React Compiler must
  // not attempt to memoize this hook's return value.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    // Only the returned values need to be persistent. Avoid O(n) message-id
    // signatures on every streamed update; AI SDK message ids are stable.
    getItemKey: (index) => messages[index]?.id ?? TYPING_ROW_KEY,
    // A comfortable high estimate reduces initial correction; real sizes are
    // supplied by measureElement as each row mounts or grows.
    estimateSize: (index) =>
      messages[index]?.role === 'user' ? 64 : 180,
    overscan: 8,
    anchorTo: 'end',
    followOnAppend: true,
    scrollEndThreshold: END_THRESHOLD,
    useAnimationFrameWithResizeObserver: true,
  })

  useImperativeHandle(
    ref,
    () => ({
      scrollToEnd: (behavior: ScrollBehavior = 'smooth') =>
        virtualizer.scrollToEnd({ behavior }),
    }),
    [virtualizer],
  )

  useLayoutEffect(() => {
    if (didInitialScrollRef.current || rowCount === 0) return
    didInitialScrollRef.current = true
    virtualizer.scrollToEnd({ behavior: 'auto' })
  }, [rowCount, virtualizer])

  // Sending a new user message starts an active turn and intentionally returns
  // the sender to the end, even when they were reading older history.
  const lastUserMessageId = lastMessage?.role === 'user' ? lastMessage.id : null
  useEffect(() => {
    if (!lastUserMessageId) return
    virtualizer.scrollToEnd({ behavior: 'auto' })
  }, [lastUserMessageId, virtualizer])

  // A successful prepend changes the first id and unlocks the next request.
  useEffect(() => {
    if (requestedFirstIdRef.current !== firstMessageId) {
      loadOlderInFlightRef.current = false
      requestedFirstIdRef.current = undefined
    }
    if (!hasOlder) loadOlderInFlightRef.current = false
  }, [firstMessageId, hasOlder])

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    if (
      !hasOlder ||
      !onLoadOlder ||
      isLoadingOlder ||
      loadOlderInFlightRef.current ||
      event.currentTarget.scrollTop > LOAD_OLDER_THRESHOLD
    ) {
      return
    }

    loadOlderInFlightRef.current = true
    requestedFirstIdRef.current = firstMessageId

    void Promise.resolve(onLoadOlder())
      .then((didLoad) => {
        if (didLoad === false) {
          loadOlderInFlightRef.current = false
          requestedFirstIdRef.current = undefined
        }
      })
      .catch(() => {
        loadOlderInFlightRef.current = false
        requestedFirstIdRef.current = undefined
      })
  }

  const virtualItems = virtualizer.getVirtualItems()
  const firstVirtualItem = virtualItems[0]
  const showJumpToLatest = rowCount > 0 && !virtualizer.isAtEnd()
  const statusAnnouncement =
    status === 'submitted'
      ? `${assistantName} is thinking.`
      : status === 'streaming'
        ? `${assistantName} is responding.`
        : status === 'error'
          ? `${assistantName} response stopped.`
          : ''

  return (
    <div className={cn('relative min-h-0 flex-1', className)}>
      {/* Keep announcements separate from virtualized children: scrolling can
          remount old rows, which must never be announced as new messages. */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {statusAnnouncement}
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full touch-pan-y overflow-y-auto overscroll-contain outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        style={{ scrollbarGutter: 'stable' }}
        role="region"
        tabIndex={0}
        aria-label="Chat messages"
        aria-busy={status === 'submitted' || status === 'streaming'}
      >
        <div
          className="relative mx-auto w-full max-w-3xl"
          style={{ height: virtualizer.getTotalSize() }}
        >
          {firstVirtualItem && (
            <div
              style={{
                transform: `translateY(${firstVirtualItem.start}px)`,
              }}
            >
              {virtualItems.map((virtualItem) => {
                const message = messages[virtualItem.index]

                return (
                  <div
                    key={virtualItem.key}
                    data-index={virtualItem.index}
                    ref={virtualizer.measureElement}
                    className="w-full px-4"
                  >
                    <div
                      className={cn(
                        'pb-5',
                        virtualItem.index === 0 && 'pt-6',
                      )}
                    >
                      {message ? (
                        <ChatMessage
                          message={message}
                          isStreaming={message.id === streamingMessageId}
                          assistant={assistant}
                          userLabel={userLabel}
                          onRegenerate={
                            message.id === regenerateTargetId
                              ? () => void onRegenerate?.(message.id)
                              : undefined
                          }
                          onToolApproval={onToolApproval}
                          renderPart={renderPart}
                          showToolDetails={showToolDetails}
                        />
                      ) : (
                        <TypingIndicator assistant={assistant} />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {isLoadingOlder && (
        <div className="pointer-events-none absolute inset-x-0 top-3 z-20 flex justify-center">
          <div className="flex items-center gap-2 rounded-full border bg-background/95 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur">
            <LoaderCircle className="size-3.5 animate-spin motion-reduce:animate-none" />
            Loading earlier messages
          </div>
        </div>
      )}

      {showJumpToLatest && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="pointer-events-auto rounded-full bg-background/95 shadow-md backdrop-blur"
            onClick={() => virtualizer.scrollToEnd({ behavior: 'smooth' })}
          >
            <ArrowDown data-icon="inline-start" />
            Jump to latest
          </Button>
        </div>
      )}
    </div>
  )
}
