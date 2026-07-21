import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '@/stores/useAppStore'

/**
 * Read/write the composer draft for a single conversation.
 *
 * The value is selected atomically (re-renders only when this conversation's
 * draft changes); the actions are grouped with `useShallow` so the returned
 * object is stable across unrelated store updates.
 */
export function useChatDraft(conversationId: string) {
  const draft = useAppStore(
    (state) => state.draftByConversationId[conversationId] ?? '',
  )

  const { setDraft, clearDraft } = useAppStore(
    useShallow((state) => ({
      setDraft: state.setDraft,
      clearDraft: state.clearDraft,
    })),
  )

  return {
    draft,
    setDraft: (value: string) => setDraft(conversationId, value),
    clearDraft: () => clearDraft(conversationId),
  }
}
