import { useMemo } from 'react'
import { useChat } from '@ai-sdk/react'
import { createCoachChatTransport } from '../api/chat-transport'

/** Streaming coach chat with token updates throttled to roughly 30 frames per second. */
export function useCoachChat(id = 'coach') {
  const transport = useMemo(() => createCoachChatTransport(), [])
  return useChat({ id, transport, experimental_throttle: 32 })
}
