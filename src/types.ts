import type { ReactNode } from 'react'

/** App-level conversation metadata; separate from AI SDK UIMessage. */
export type ChatRole = 'user' | 'assistant' | 'system'

export interface ChatMessage {
  id: string
  role: ChatRole
  /** Raw Markdown content (rendered later by the chat Markdown pipeline). */
  content: string
  createdAt: string
}

export interface Conversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

/** Visual and accessible identity used by reusable chat components. */
export interface ChatAssistantIdentity {
  name: string
  subtitle?: string
  /** Usually an icon or avatar element rendered inside AvatarFallback. */
  avatar?: ReactNode
}

/** AI SDK tool approval callback shape used by the built-in tool card. */
export interface ChatToolApproval {
  approvalId: string
  approved: boolean
  reason?: string
}

export type ChatToolApprovalHandler = (
  approval: ChatToolApproval,
) => void | PromiseLike<void>
