import { useCallback } from 'react'
import { Apple, BicepsFlexed, MoonStar, TimerReset } from 'lucide-react'
import { useChatDraft } from '../hooks/use-chat-draft'
import { useCoachChat } from '../hooks/use-coach-chat'
import type { ChatSuggestion } from './chat-empty-state'
import { ChatSurface } from './chat-surface'

const DEFAULT_CONVERSATION_ID = 'coach'

const FITNESS_SUGGESTIONS: ChatSuggestion[] = [
  {
    label: 'Build a 3-day strength routine',
    prompt:
      'Build me a balanced three-day strength routine with exercises, sets, reps, and progression.',
    icon: BicepsFlexed,
  },
  {
    label: 'Create a 20-minute workout',
    prompt:
      'Create a 20-minute full-body workout I can do with minimal equipment.',
    icon: TimerReset,
  },
  {
    label: 'Plan high-protein meals',
    prompt:
      'Give me practical high-protein meal ideas for a normal week, with flexible options.',
    icon: Apple,
  },
  {
    label: 'Improve sleep and recovery',
    prompt:
      'Help me improve recovery with a simple sleep, mobility, and rest-day routine.',
    icon: MoonStar,
  },
]

export interface ChatPageProps {
  conversationId?: string
}

/** App-specific fitness-coach wiring around the reusable ChatSurface. */
export function ChatPage({
  conversationId = DEFAULT_CONVERSATION_ID,
}: ChatPageProps) {
  const {
    messages,
    sendMessage,
    status,
    error,
    stop,
    regenerate,
    clearError,
    setMessages,
    addToolApprovalResponse,
  } = useCoachChat(conversationId)
  const { draft, setDraft, clearDraft } = useChatDraft(conversationId)

  const handleSend = useCallback(
    async (text: string) => {
      clearError()
      await sendMessage({ text })
    },
    [clearError, sendMessage],
  )

  const handleRetry = useCallback(async () => {
    clearError()
    const lastMessage = messages.at(-1)

    if (lastMessage?.role === 'assistant') {
      await regenerate({ messageId: lastMessage.id })
      return
    }

    // A request may fail before an assistant message exists. In that case,
    // resubmit the current user-message history instead of calling regenerate.
    await sendMessage()
  }, [clearError, messages, regenerate, sendMessage])

  const handleNewChat = useCallback(() => {
    stop()
    clearError()
    setMessages([])
    clearDraft()
  }, [clearDraft, clearError, setMessages, stop])

  return (
    <ChatSurface
      messages={messages}
      status={status}
      error={error}
      draft={draft}
      onDraftChange={setDraft}
      onSend={handleSend}
      onStop={stop}
      onRegenerate={(messageId) => regenerate({ messageId })}
      onRetry={handleRetry}
      onToolApproval={({ approvalId, approved, reason }) =>
        addToolApprovalResponse({ id: approvalId, approved, reason })
      }
      onClearError={clearError}
      onNewChat={handleNewChat}
      assistant={{
        name: 'Coach',
        subtitle: 'Training · nutrition · recovery',
        avatar: <BicepsFlexed className="size-4" aria-hidden />,
      }}
      suggestions={FITNESS_SUGGESTIONS}
      emptyStateTitle="What are we working on today?"
      emptyStateDescription="Ask your coach for a workout, nutrition ideas, recovery help, or a clear next step toward your goals."
      composerPlaceholder="Ask about training, nutrition, recovery, or your plan…"
      composerDisclaimer="Coach can make mistakes — get professional guidance for injuries or medical conditions."
      errorTitle="The coach could not finish that response"
    />
  )
}
