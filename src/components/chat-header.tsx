import type { ChatStatus } from 'ai'
import { Bot, Check, Clipboard, LoaderCircle, SquarePen } from 'lucide-react'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../ui/tooltip'
import type { ChatAssistantIdentity } from '../types'

export interface ChatHeaderProps {
  status: ChatStatus
  hasMessages: boolean
  assistant?: Partial<ChatAssistantIdentity>
  copied?: boolean
  onCopyConversation?: () => void
  onNewChat?: () => void
}

/** Assistant identity, stream status, and optional conversation actions. */
export function ChatHeader({
  status,
  hasMessages,
  assistant,
  copied = false,
  onCopyConversation,
  onNewChat,
}: ChatHeaderProps) {
  const name = assistant?.name ?? 'Assistant'
  const subtitle = assistant?.subtitle ?? 'AI assistant'
  const isBusy = status === 'submitted' || status === 'streaming'

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b px-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar>
          <AvatarFallback>
            {assistant?.avatar ?? <Bot className="size-4" aria-hidden />}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-sm font-semibold">{name}</h1>
            {isBusy && (
              <Badge variant="secondary" className="gap-1 font-normal">
                <LoaderCircle className="size-3 animate-spin motion-reduce:animate-none" />
                {status === 'submitted' ? 'Thinking' : 'Responding'}
              </Badge>
            )}
          </div>
          {subtitle && (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        {onCopyConversation && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={!hasMessages}
                onClick={onCopyConversation}
                aria-label={
                  copied ? 'Conversation copied' : 'Copy conversation'
                }
              >
                {copied ? <Check /> : <Clipboard />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {copied ? 'Copied' : 'Copy conversation'}
            </TooltipContent>
          </Tooltip>
        )}

        {onNewChat && hasMessages && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={isBusy}
                onClick={onNewChat}
                aria-label="Start a new chat"
              >
                <SquarePen />
              </Button>
            </TooltipTrigger>
            <TooltipContent>New chat</TooltipContent>
          </Tooltip>
        )}
      </div>
    </header>
  )
}
