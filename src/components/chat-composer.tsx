import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import type { ChatStatus } from 'ai'
import { ArrowUp, Square } from 'lucide-react'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '../ui/input-group'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../ui/tooltip'
import { cn } from '../lib/utils'

export type ChatSubmitMode = 'enter' | 'desktop-enter' | 'mod-enter'

export interface ChatComposerProps {
  value: string
  onChange: (value: string) => void
  onSend: (text: string) => void | Promise<void>
  onStop?: () => void
  status: ChatStatus
  placeholder?: string
  ariaLabel?: string
  maxLength?: number
  autoFocus?: boolean
  /**
   * `desktop-enter` avoids accidental sends from mobile virtual keyboards.
   * `mod-enter` uses Ctrl/Cmd+Enter and leaves plain Enter for newlines.
   */
  submitMode?: ChatSubmitMode
  disclaimer?: string
  /** Optional model picker, attachment button, web-search toggle, etc. */
  footerStart?: ReactNode
  className?: string
}

function useCoarsePrimaryPointer() {
  const [isCoarse, setIsCoarse] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(
      '(pointer: coarse) and (not (any-pointer: fine))',
    )
    const update = () => setIsCoarse(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return isCoarse
}

/** Controlled, CSS-auto-growing composer with IME-safe keyboard handling. */
export function ChatComposer({
  value,
  onChange,
  onSend,
  onStop,
  status,
  placeholder = 'Message the assistant…',
  ariaLabel = 'Message the assistant',
  maxLength = 8000,
  autoFocus = true,
  submitMode = 'desktop-enter',
  disclaimer = 'AI can make mistakes. Check important information.',
  footerStart,
  className,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const submitInFlightRef = useRef(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const helpId = useId()
  const isCoarsePointer = useCoarsePrimaryPointer()
  const isBusy = status === 'submitted' || status === 'streaming'
  const trimmed = value.trim()
  const canSend =
    !isBusy && !isSubmitting && trimmed.length > 0 && trimmed.length <= maxLength
  const showCount = value.length >= Math.floor(maxLength * 0.8)

  useEffect(() => {
    if (autoFocus && !isCoarsePointer) textareaRef.current?.focus()
  }, [autoFocus, isCoarsePointer])

  const send = async () => {
    if (!canSend || submitInFlightRef.current) return

    submitInFlightRef.current = true
    setIsSubmitting(true)
    try {
      await onSend(trimmed)
      requestAnimationFrame(() => textareaRef.current?.focus())
    } catch {
      // Transport state and the parent error surface own user-facing feedback.
    } finally {
      submitInFlightRef.current = false
      setIsSubmitting(false)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void send()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) return
    if (event.nativeEvent.isComposing || event.keyCode === 229) return

    const modifierPressed = event.metaKey || event.ctrlKey
    const shouldSubmit =
      submitMode === 'enter' ||
      (submitMode === 'desktop-enter' && !isCoarsePointer) ||
      (submitMode === 'mod-enter' && modifierPressed)

    if (!shouldSubmit || !canSend) return
    event.preventDefault()
    void send()
  }

  const shortcutLabel =
    submitMode === 'mod-enter'
      ? 'Ctrl/Cmd+Enter to send'
      : submitMode === 'desktop-enter'
        ? 'Enter to send on desktop'
        : 'Enter to send'

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'mx-auto w-full max-w-3xl px-4 pb-3 sm:pb-5',
        className,
      )}
    >
      <InputGroup className="h-auto rounded-3xl bg-background/95 shadow-sm backdrop-blur dark:bg-background/90">
        <InputGroupTextarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={1}
          dir="auto"
          autoComplete="off"
          enterKeyHint={submitMode === 'enter' ? 'send' : 'enter'}
          aria-label={ariaLabel}
          aria-describedby={disclaimer ? helpId : undefined}
          className="max-h-44 min-h-11 overflow-y-auto px-4 pt-3 pb-1.5 text-[0.9375rem] leading-6 sm:text-base"
        />

        <InputGroupAddon
          align="block-end"
          className="justify-between gap-2 px-2.5 pb-2.5"
        >
          <div className="flex min-w-0 items-center gap-2 px-1 text-xs font-normal text-muted-foreground">
            {footerStart}
            <span className="hidden truncate sm:inline">
              {shortcutLabel} · Shift+Enter for a new line
            </span>
            {showCount && (
              <span
                className={cn(
                  'tabular-nums',
                  value.length >= maxLength && 'text-destructive',
                )}
                aria-live="polite"
              >
                {value.length}/{maxLength}
              </span>
            )}
          </div>

          {isBusy && onStop ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <InputGroupButton
                  type="button"
                  variant="secondary"
                  size="icon-sm"
                  className="ms-auto rounded-full"
                  onClick={onStop}
                  aria-label="Stop generating"
                >
                  <Square className="size-3.5 fill-current" />
                </InputGroupButton>
              </TooltipTrigger>
              <TooltipContent>Stop response</TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <InputGroupButton
                  type="submit"
                  variant="default"
                  size="icon-sm"
                  className="ms-auto rounded-full"
                  disabled={!canSend}
                  aria-label="Send message"
                >
                  <ArrowUp />
                </InputGroupButton>
              </TooltipTrigger>
              <TooltipContent>Send message</TooltipContent>
            </Tooltip>
          )}
        </InputGroupAddon>
      </InputGroup>

      {disclaimer && (
        <p
          id={helpId}
          className="mt-2 text-center text-xs text-muted-foreground"
        >
          {disclaimer}
        </p>
      )}
    </form>
  )
}
