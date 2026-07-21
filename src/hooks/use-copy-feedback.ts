import { useCallback, useEffect, useRef, useState } from 'react'
import { copyText } from '../lib/clipboard'

export function useCopyFeedback(durationMs = 1600) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
    },
    [],
  )

  const copy = useCallback(
    async (text: string) => {
      const success = await copyText(text)
      if (!success) return false

      setCopied(true)
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
      timeoutRef.current = window.setTimeout(() => setCopied(false), durationMs)
      return true
    },
    [durationMs],
  )

  return { copied, copy }
}
