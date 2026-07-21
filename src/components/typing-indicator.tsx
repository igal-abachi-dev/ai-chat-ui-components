import { Bot } from 'lucide-react'
import { Avatar, AvatarFallback } from '../ui/avatar'
import type { ChatAssistantIdentity } from '../types'

export interface TypingIndicatorProps {
  assistant?: Partial<ChatAssistantIdentity>
}

/** Measured visual placeholder shown after submit and before the first token. */
export function TypingIndicator({ assistant }: TypingIndicatorProps) {
  return (
    <div className="flex items-start gap-3" aria-hidden="true">
      <Avatar size="sm" className="mt-0.5 shrink-0">
        <AvatarFallback>
          {assistant?.avatar ?? <Bot className="size-3.5" aria-hidden />}
        </AvatarFallback>
      </Avatar>
      <div className="flex h-6 items-center gap-1">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className="size-1.5 animate-bounce rounded-full bg-muted-foreground/70 motion-reduce:animate-none"
            style={{ animationDelay: `${index * 150}ms` }}
          />
        ))}
      </div>
    </div>
  )
}
