import { memo, useMemo } from 'react'
import {
  Streamdown,
  defaultUrlTransform,
  type Components,
  type UrlTransform,
} from 'streamdown'
import 'streamdown/styles.css'
import { cn } from '../lib/utils'

export interface ChatMarkdownProps {
  children: string
  className?: string
  /** Enables incomplete-Markdown repair while the active response streams. */
  isStreaming?: boolean
  /** Remote Markdown images are blocked by default to avoid tracking pixels. */
  allowRemoteImages?: boolean
}

const SAFE_MARKDOWN_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:'])

function stripAstNode<T extends { node?: unknown }>(props: T): Omit<T, 'node'> {
  const domProps = { ...props }
  delete domProps.node
  return domProps
}

function isSafeMarkdownUrl(url: string) {
  if (url === 'streamdown:incomplete-link') return true
  if (/^(?:[/?#.]|\.\.)/.test(url)) return true

  try {
    return SAFE_MARKDOWN_PROTOCOLS.has(new URL(url).protocol)
  } catch {
    return false
  }
}

/** Streaming-safe, hardened GFM renderer shared by assistant text parts. */
export const ChatMarkdown = memo(function ChatMarkdown({
  children,
  className,
  isStreaming = false,
  allowRemoteImages = false,
}: ChatMarkdownProps) {
  const urlTransform = useMemo<UrlTransform>(() => {
    return (url, key, node) => {
      if (node.tagName === 'img' && !allowRemoteImages) return null
      const transformed = defaultUrlTransform(url, key, node)
      if (!transformed || !isSafeMarkdownUrl(transformed)) return null
      return transformed
    }
  }, [allowRemoteImages])

  const components = useMemo<Components>(
    () => ({
      a: ({ className: componentClassName, ...props }) => (
        <a
          {...stripAstNode(props)}
          target="_blank"
          rel="noreferrer noopener"
          referrerPolicy="no-referrer"
          className={cn(
            'font-medium underline decoration-foreground/25 underline-offset-4 transition-colors hover:decoration-foreground/70',
            componentClassName,
          )}
        />
      ),
      p: ({ className: componentClassName, ...props }) => (
        <p
          {...stripAstNode(props)}
          className={cn('my-3 first:mt-0 last:mb-0', componentClassName)}
        />
      ),
      ul: ({ className: componentClassName, ...props }) => (
        <ul
          {...stripAstNode(props)}
          className={cn('my-3 list-disc space-y-1 ps-6', componentClassName)}
        />
      ),
      ol: ({ className: componentClassName, ...props }) => (
        <ol
          {...stripAstNode(props)}
          className={cn('my-3 list-decimal space-y-1 ps-6', componentClassName)}
        />
      ),
      li: ({ className: componentClassName, ...props }) => (
        <li {...stripAstNode(props)} className={cn('ps-1', componentClassName)} />
      ),
      h1: ({ className: componentClassName, ...props }) => (
        <h1
          {...stripAstNode(props)}
          className={cn(
            'mt-6 mb-3 text-xl font-semibold first:mt-0',
            componentClassName,
          )}
        />
      ),
      h2: ({ className: componentClassName, ...props }) => (
        <h2
          {...stripAstNode(props)}
          className={cn(
            'mt-6 mb-3 text-lg font-semibold first:mt-0',
            componentClassName,
          )}
        />
      ),
      h3: ({ className: componentClassName, ...props }) => (
        <h3
          {...stripAstNode(props)}
          className={cn(
            'mt-5 mb-2 font-semibold first:mt-0',
            componentClassName,
          )}
        />
      ),
      blockquote: ({ className: componentClassName, ...props }) => (
        <blockquote
          {...stripAstNode(props)}
          className={cn(
            'my-4 border-s-2 ps-4 text-muted-foreground',
            componentClassName,
          )}
        />
      ),
      hr: ({ className: componentClassName, ...props }) => (
        <hr
          {...stripAstNode(props)}
          className={cn('my-6 border-border', componentClassName)}
        />
      ),
      table: ({ className: componentClassName, ...props }) => (
        <div className="my-4 overflow-x-auto rounded-xl border">
          <table
            {...stripAstNode(props)}
            className={cn(
              'w-full border-collapse text-sm',
              componentClassName,
            )}
          />
        </div>
      ),
      th: ({ className: componentClassName, ...props }) => (
        <th
          {...stripAstNode(props)}
          className={cn(
            'bg-muted/60 px-3 py-2 text-start font-medium',
            componentClassName,
          )}
        />
      ),
      td: ({ className: componentClassName, ...props }) => (
        <td
          {...stripAstNode(props)}
          className={cn('border-t px-3 py-2 align-top', componentClassName)}
        />
      ),
      img: ({ className: componentClassName, alt, ...props }) => (
        <img
          {...stripAstNode(props)}
          alt={alt ?? ''}
          loading="lazy"
          referrerPolicy="no-referrer"
          className={cn(
            'my-4 max-h-96 max-w-full rounded-xl border object-contain',
            componentClassName,
          )}
        />
      ),
    }),
    [],
  )

  return (
    <Streamdown
      mode={isStreaming ? 'streaming' : 'static'}
      parseIncompleteMarkdown={isStreaming}
      dir="auto"
      skipHtml
      urlTransform={urlTransform}
      components={components}
      controls={{
        code: { copy: true, download: false },
        table: { copy: true, download: false, fullscreen: false },
        mermaid: false,
      }}
      lineNumbers={false}
      className={cn('min-w-0 text-sm leading-7 break-words', className)}
    >
      {children}
    </Streamdown>
  )
})
