import type { ComponentProps } from 'react'
import { TooltipProvider } from '../ui/tooltip'

export type ChatUiProviderProps = ComponentProps<typeof TooltipProvider>

/**
 * Shared UI provider for standalone chat primitives.
 * `ChatSurface` includes this automatically; use it when composing lower-level
 * exports such as `ChatComposer` and `ChatMessageList` yourself.
 */
export function ChatUiProvider({
  delayDuration = 250,
  skipDelayDuration = 300,
  ...props
}: ChatUiProviderProps) {
  return (
    <TooltipProvider
      delayDuration={delayDuration}
      skipDelayDuration={skipDelayDuration}
      {...props}
    />
  )
}
