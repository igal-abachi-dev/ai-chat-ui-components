import { AlertCircle, RotateCw, X } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { Button } from '../ui/button'

export interface ChatErrorProps {
  title?: string
  /** Safe user-facing copy. Raw server errors are intentionally not shown. */
  message?: string
  onRetry?: () => void
  onDismiss?: () => void
}

/** Stream/transport failure banner with optional retry and dismiss actions. */
export function ChatError({
  title = 'The response could not be completed',
  message = 'Check your connection and try again.',
  onRetry,
  onDismiss,
}: ChatErrorProps) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4">
      <Alert variant="destructive" className="relative pe-11">
        <AlertCircle />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="flex flex-wrap items-center gap-3">
          <span>{message}</span>
          {onRetry && (
            <Button type="button" size="xs" variant="outline" onClick={onRetry}>
              <RotateCw data-icon="inline-start" />
              Retry
            </Button>
          )}
        </AlertDescription>
        {onDismiss && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="absolute top-2 end-2"
            onClick={onDismiss}
            aria-label="Dismiss error"
          >
            <X />
          </Button>
        )}
      </Alert>
    </div>
  )
}
