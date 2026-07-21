import { Fragment, memo, useState, type ReactNode } from 'react'
import {
  getToolOrDynamicToolName,
  isDataUIPart,
  isToolOrDynamicToolUIPart,
  type DynamicToolUIPart,
  type FileUIPart,
  type SourceDocumentUIPart,
  type SourceUrlUIPart,
  type ToolUIPart,
  type UIMessage,
} from 'ai'
import {
  Bot,
  Check,
  ChevronDown,
  Clipboard,
  File,
  LoaderCircle,
  RefreshCw,
  Wrench,
  X,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../ui/tooltip'
import { cn } from '../lib/utils'
import { useCopyFeedback } from '../hooks/use-copy-feedback'
import { getMessageText } from '../lib/message-utils'
import { getSafeLinkUrl, getSafeResourceUrl } from '../lib/safe-url'
import type { ChatAssistantIdentity, ChatToolApprovalHandler } from '../types'
import { ChatMarkdown } from './chat-markdown'

export type ChatMessagePart = UIMessage['parts'][number]

export interface ChatPartRenderContext {
  message: UIMessage
  index: number
}

/** Return `undefined` to use the built-in renderer; return `null` to hide. */
export type ChatPartRenderer = (
  part: ChatMessagePart,
  context: ChatPartRenderContext,
) => ReactNode | undefined

export interface ChatMessageProps {
  message: UIMessage
  /** True only for the assistant message currently receiving tokens. */
  isStreaming?: boolean
  /** Shown on the last settled assistant message when provided. */
  onRegenerate?: () => void
  /** Handles AI SDK approval-requested tool parts. */
  onToolApproval?: ChatToolApprovalHandler
  /** Optional escape hatch for product-specific tool/data/source cards. */
  renderPart?: ChatPartRenderer
  /** Reveals generic JSON input/output inside collapsed tool/data cards. */
  showToolDetails?: boolean
  assistant?: Partial<ChatAssistantIdentity>
  userLabel?: string
}

const MAX_TOOL_DETAIL_CHARS = 20_000

function formatUnknown(value: unknown): string {
  let formatted: string
  if (typeof value === 'string') {
    formatted = value
  } else {
    try {
      formatted = JSON.stringify(value, null, 2) ?? String(value)
    } catch {
      formatted = String(value)
    }
  }

  return formatted.length > MAX_TOOL_DETAIL_CHARS
    ? `${formatted.slice(0, MAX_TOOL_DETAIL_CHARS)}\n… output truncated`
    : formatted
}

function humanizeIdentifier(value: string): string {
  const spaced = value
    .replace(/^tool-/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim()

  return spaced ? spaced.charAt(0).toUpperCase() + spaced.slice(1) : 'Tool'
}

function getToolPresentation(part: ToolUIPart | DynamicToolUIPart) {
  switch (part.state) {
    case 'input-streaming':
    case 'input-available':
      return { label: 'Working', pending: true, destructive: false }
    case 'approval-requested':
      return { label: 'Approval needed', pending: false, destructive: false }
    case 'approval-responded':
      return {
        label: part.approval.approved ? 'Approved' : 'Denied',
        pending: false,
        destructive: !part.approval.approved,
      }
    case 'output-available':
      return {
        label: part.preliminary ? 'Updating' : 'Done',
        pending: Boolean(part.preliminary),
        destructive: false,
      }
    case 'output-error':
      return { label: 'Failed', pending: false, destructive: true }
    case 'output-denied':
      return { label: 'Denied', pending: false, destructive: true }
  }
}

function ToolPart({
  part,
  showDetails,
  onApproval,
}: {
  part: ToolUIPart | DynamicToolUIPart
  showDetails: boolean
  onApproval?: ChatToolApprovalHandler
}) {
  const [approvalPending, setApprovalPending] = useState(false)
  const [approvalError, setApprovalError] = useState<string>()
  const presentation = getToolPresentation(part)
  const toolName =
    part.title?.trim() || humanizeIdentifier(getToolOrDynamicToolName(part))
  const hasInput = part.input !== undefined
  const hasOutput = part.state === 'output-available'
  const hasError = part.state === 'output-error'
  const hasDeniedReason =
    (part.state === 'output-denied' ||
      (part.state === 'approval-responded' && !part.approval.approved)) &&
    Boolean(part.approval.reason)
  const hasDetails =
    showDetails && (hasInput || hasOutput || hasError || hasDeniedReason)
  const needsApproval = part.state === 'approval-requested' && onApproval

  const respondToApproval = async (approved: boolean) => {
    if (part.state !== 'approval-requested' || !onApproval || approvalPending) {
      return
    }

    setApprovalError(undefined)
    setApprovalPending(true)
    try {
      await onApproval({
        approvalId: part.approval.id,
        approved,
      })
    } catch {
      setApprovalError('Could not submit that decision. Please try again.')
    } finally {
      setApprovalPending(false)
    }
  }

  const summary = (
    <>
      {presentation.pending ? (
        <LoaderCircle className="size-4 animate-spin text-muted-foreground motion-reduce:animate-none" />
      ) : (
        <Wrench className="size-4 text-muted-foreground" />
      )}
      <span className="min-w-0 flex-1 truncate font-medium">{toolName}</span>
      <Badge variant={presentation.destructive ? 'destructive' : 'outline'}>
        {presentation.label}
      </Badge>
    </>
  )

  return (
    <div className="my-3 rounded-xl border bg-muted/30">
      {hasDetails ? (
        <Collapsible>
          <CollapsibleTrigger className="group flex w-full items-center gap-2 px-3 py-2.5 text-start text-sm">
            {summary}
            <ChevronDown className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 border-t px-3 py-3 text-xs">
            {hasInput && (
              <div>
                <p className="mb-1 font-medium text-muted-foreground">Input</p>
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-background p-2.5">
                  {formatUnknown(part.input)}
                </pre>
              </div>
            )}
            {hasOutput && (
              <div>
                <p className="mb-1 font-medium text-muted-foreground">Result</p>
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-background p-2.5">
                  {formatUnknown(part.output)}
                </pre>
              </div>
            )}
            {hasError && (
              <p className="rounded-lg bg-destructive/10 p-2.5 text-destructive">
                {part.errorText}
              </p>
            )}
            {hasDeniedReason && (
              <p className="rounded-lg bg-destructive/10 p-2.5 text-destructive">
                {part.approval.reason}
              </p>
            )}
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2.5 text-sm">
          {summary}
        </div>
      )}

      {needsApproval && (
        <div className="flex justify-end gap-2 border-t px-3 py-2.5">
          <Button
            type="button"
            size="xs"
            variant="outline"
            disabled={approvalPending}
            onClick={() => void respondToApproval(false)}
          >
            <X data-icon="inline-start" />
            Deny
          </Button>
          <Button
            type="button"
            size="xs"
            disabled={approvalPending}
            onClick={() => void respondToApproval(true)}
          >
            {approvalPending ? (
              <LoaderCircle className="animate-spin motion-reduce:animate-none" />
            ) : (
              <Check data-icon="inline-start" />
            )}
            Approve
          </Button>
        </div>
      )}

      {approvalError && (
        <p className="border-t px-3 py-2 text-xs text-destructive" role="alert">
          {approvalError}
        </p>
      )}
    </div>
  )
}

function DataPart({ part }: { part: ChatMessagePart }) {
  if (!isDataUIPart(part)) return null

  return (
    <Collapsible className="my-3 rounded-xl border bg-muted/30">
      <CollapsibleTrigger className="group flex w-full items-center gap-2 px-3 py-2.5 text-start text-sm">
        <Wrench className="size-4 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate font-medium">
          {humanizeIdentifier(part.type.replace(/^data-/, ''))}
        </span>
        <ChevronDown className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t px-3 py-3 text-xs">
        <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-background p-2.5">
          {formatUnknown(part.data)}
        </pre>
      </CollapsibleContent>
    </Collapsible>
  )
}

function SourcePart({
  part,
}: {
  part: SourceUrlUIPart | SourceDocumentUIPart
}) {
  const pill =
    'inline-flex max-w-full items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground'

  if (part.type === 'source-url') {
    const safeUrl = getSafeLinkUrl(part.url)
    if (!safeUrl) {
      return (
        <span className={pill} title="Unsafe source URL was blocked">
          <span className="truncate">{part.title ?? 'Blocked source'}</span>
        </span>
      )
    }

    return (
      <a
        href={safeUrl}
        target="_blank"
        rel="noreferrer noopener"
        referrerPolicy="no-referrer"
        className={cn(
          pill,
          'transition-colors hover:bg-accent hover:text-accent-foreground',
        )}
      >
        <span className="truncate">{part.title ?? part.url}</span>
      </a>
    )
  }

  return (
    <span className={pill} title={part.filename ?? part.title}>
      <File className="size-3 shrink-0" />
      <span className="truncate">{part.title}</span>
    </span>
  )
}

function FilePart({
  part,
  compact = false,
}: {
  part: FileUIPart
  compact?: boolean
}) {
  const safeUrl = getSafeResourceUrl(part.url, part.mediaType)
  if (!safeUrl) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 rounded-xl border bg-muted/40 p-3 text-muted-foreground',
          compact ? 'max-w-64' : 'max-w-sm',
        )}
        title="Unsafe attachment URL was blocked"
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          <File className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {part.filename ?? 'Unavailable attachment'}
          </p>
          <p className="truncate text-xs">Link blocked</p>
        </div>
      </div>
    )
  }

  if (part.mediaType.startsWith('image/')) {
    return (
      <a
        href={safeUrl}
        target="_blank"
        rel="noreferrer noopener"
        referrerPolicy="no-referrer"
        className={cn(
          'block overflow-hidden rounded-xl border bg-muted',
          compact ? 'max-w-64' : 'max-w-sm',
        )}
      >
        <img
          src={safeUrl}
          alt={part.filename ?? 'Attached image'}
          className="max-h-72 w-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </a>
    )
  }

  return (
    <a
      href={safeUrl}
      target="_blank"
      rel="noreferrer noopener"
      referrerPolicy="no-referrer"
      className={cn(
        'flex items-center gap-3 rounded-xl border bg-background p-3 text-foreground transition-colors hover:bg-accent',
        compact ? 'max-w-64' : 'max-w-sm',
      )}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <File className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {part.filename ?? 'Attachment'}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {part.mediaType}
        </p>
      </div>
    </a>
  )
}

function UserMessageParts({
  message,
  renderPart,
}: {
  message: UIMessage
  renderPart?: ChatPartRenderer
}) {
  return (
    <div className="space-y-2">
      {message.parts.map((part, index) => {
        const custom = renderPart?.(part, { message, index })
        if (custom !== undefined) {
          return <Fragment key={`${message.id}-${index}`}>{custom}</Fragment>
        }

        if (part.type === 'text') {
          return part.text ? (
            <p key={`${message.id}-${index}`} dir="auto" className="whitespace-pre-wrap">
              {part.text}
            </p>
          ) : null
        }

        if (part.type === 'file') {
          return (
            <FilePart
              key={`${message.id}-${index}`}
              part={part}
              compact
            />
          )
        }

        return null
      })}
    </div>
  )
}

function AssistantMessageParts({
  message,
  isStreaming,
  onToolApproval,
  renderPart,
  showToolDetails,
}: {
  message: UIMessage
  isStreaming: boolean
  onToolApproval?: ChatToolApprovalHandler
  renderPart?: ChatPartRenderer
  showToolDetails: boolean
}) {
  const preparedParts = message.parts.map((part, index) => ({
    part,
    index,
    custom: renderPart?.(part, { message, index }),
  }))

  const lastTextIndex = preparedParts.reduce(
    (last, current) => (current.part.type === 'text' ? current.index : last),
    -1,
  )

  const defaultSources = preparedParts.filter(
    ({ part, custom }) =>
      custom === undefined &&
      (part.type === 'source-url' || part.type === 'source-document'),
  )

  return (
    <>
      {preparedParts.map(({ part, index, custom }) => {
        const key = `${message.id}-${index}`

        if (custom !== undefined) return <Fragment key={key}>{custom}</Fragment>
        if (isToolOrDynamicToolUIPart(part)) {
          return (
            <ToolPart
              key={key}
              part={part}
              showDetails={showToolDetails}
              onApproval={onToolApproval}
            />
          )
        }
        if (isDataUIPart(part)) {
          return showToolDetails ? <DataPart key={key} part={part} /> : null
        }

        switch (part.type) {
          case 'text':
            return part.text ? (
              <ChatMarkdown
                key={key}
                isStreaming={isStreaming && index === lastTextIndex}
              >
                {part.text}
              </ChatMarkdown>
            ) : null
          case 'reasoning':
            return part.state === 'streaming' ? (
              <div
                key={key}
                className="mb-3 flex items-center gap-2 text-xs text-muted-foreground"
              >
                <LoaderCircle className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden />
                Thinking it through…
              </div>
            ) : null
          case 'file':
            return (
              <div key={key} className="my-3">
                <FilePart part={part} />
              </div>
            )
          case 'source-url':
          case 'source-document':
          case 'step-start':
          default:
            return null
        }
      })}

      {defaultSources.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Sources">
          {defaultSources.map(({ part }) => {
            if (part.type !== 'source-url' && part.type !== 'source-document') {
              return null
            }
            return <SourcePart key={part.sourceId} part={part} />
          })}
        </div>
      )}
    </>
  )
}

/** A memoized AI SDK UIMessage row with rich part rendering. */
export const ChatMessage = memo(function ChatMessage({
  message,
  isStreaming = false,
  onRegenerate,
  onToolApproval,
  renderPart,
  showToolDetails = false,
  assistant,
  userLabel = 'You',
}: ChatMessageProps) {
  const { copied, copy } = useCopyFeedback()

  if (message.role === 'system') {
    return (
      <div className="flex justify-center py-1">
        <Badge variant="outline" className="font-normal text-muted-foreground">
          System instruction
        </Badge>
      </div>
    )
  }

  if (message.role === 'user') {
    return (
      <article className="flex justify-end" aria-label={userLabel}>
        <div className="max-w-[88%] rounded-2xl rounded-ee-sm bg-primary px-4 py-2.5 text-sm break-words text-primary-foreground sm:max-w-[76%]">
          <UserMessageParts message={message} renderPart={renderPart} />
        </div>
      </article>
    )
  }

  const text = getMessageText(message)
  const assistantName = assistant?.name ?? 'Assistant'
  const showActions = !isStreaming && text.length > 0

  return (
    <article
      className="group/message flex items-start gap-3"
      aria-label={assistantName}
    >
      <Avatar size="sm" className="mt-1 shrink-0">
        <AvatarFallback>
          {assistant?.avatar ?? <Bot className="size-3.5" aria-hidden />}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <AssistantMessageParts
          message={message}
          isStreaming={isStreaming}
          onToolApproval={onToolApproval}
          renderPart={renderPart}
          showToolDetails={showToolDetails}
        />

        {isStreaming && (
          <span
            className="ms-0.5 inline-block h-4 w-2 animate-pulse rounded-[2px] bg-foreground/80 align-text-bottom"
            aria-hidden
          />
        )}

        {showActions && (
          <div className="mt-1 flex items-center gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within/message:opacity-100 sm:group-hover/message:opacity-100">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => void copy(text)}
                  aria-label={copied ? 'Response copied' : 'Copy response'}
                >
                  {copied ? <Check /> : <Clipboard />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{copied ? 'Copied' : 'Copy'}</TooltipContent>
            </Tooltip>

            {onRegenerate && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={onRegenerate}
                    aria-label="Regenerate response"
                  >
                    <RefreshCw />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Regenerate</TooltipContent>
              </Tooltip>
            )}
          </div>
        )}
      </div>
    </article>
  )
})
