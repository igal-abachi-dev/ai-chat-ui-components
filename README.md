# React ai-chat-ui-components , @igal-abachi-dev/react-ai-chat-ui
chat ui composer/surface components lib for ai chat sites


# React AI Chat UI

[![CI](https://github.com/igal-abachi-dev/react-ai-chat-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/igal-abachi-dev/react-ai-chat-ui/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/%40igal-abachi-dev%2Freact-ai-chat-ui)](https://www.npmjs.com/package/@igal-abachi-dev/react-ai-chat-ui)
[![MIT license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

Production-grade, reusable chat components for **React**, **TypeScript**, the
**Vercel AI SDK**, **Streamdown** , **TanStack Virtual**, **Tailwind CSS**, and shadcn-style design
tokens.

The library is built for the parts that basic chat examples usually get wrong:
streaming rows whose height changes token by token, preserving the reader's
position, rendering AI SDK message parts, tool approvals, incomplete Markdown,
mobile keyboards, IME input, RTL text, and safe source/file links.

## Why use it

- **Correct streaming scroll behavior** — end anchoring, measured dynamic rows,
  append following only while the reader is at the bottom, and a measured
  submitted-state typing row.
- **Long-conversation performance** — TanStack Virtual renders only the visible
  transcript while preserving stable message IDs and history prepends.
- **AI SDK v6 parts** — text, reasoning, files, sources, data parts, static and
  dynamic tools, preliminary output, errors, and approval workflows.
- **Streaming Markdown** — Streamdown markdown renderer(streaming) repairs incomplete Markdown while tokens
  arrive and supplies hardened defaults for links, code, and tables.
- **Controlled architecture** — transport, persistence, routing, and server
  state remain in your app; the library owns presentation and interaction.
- **Production composer** — auto-growing textarea, duplicate-submit lock,
  desktop/mobile submit policies, Shift+Enter, IME protection, character limit,
  stop generation, and draft restoration support.
- **Accessible virtualization** — the virtualized transcript is deliberately
  not an ARIA live region; a separate status announcer avoids replaying old rows.
- **RTL-ready** — logical CSS properties and `dir="auto"` work with Hebrew,
  Arabic, and mixed-direction messages.
- **Customizable** — assistant identity, starter prompts, disclaimer, custom
  message-part renderer, tool details, history loading, and composer controls.
- **No shadcn copy step** — the npm package includes its internal primitives and
  compiled CSS while retaining shadcn-compatible semantic tokens.

## Installation

```bash
npm install @igal-abachi-dev/react-ai-chat-ui \
  react react-dom ai @ai-sdk/react @tanstack/react-virtual
```

Import the compiled stylesheet once in your application entry:

```tsx
import '@igal-abachi-dev/react-ai-chat-ui/styles.css'
```

The package is ESM-first and targets modern React applications. React, React
DOM, `ai`, and TanStack Virtual are peer dependencies so your application owns
those singleton/runtime versions.

## Quick start with Vercel AI SDK

```tsx
import { useMemo, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import {
  ChatSurface,
  type ChatSuggestion,
} from '@igal-abachi-dev/react-ai-chat-ui'
import '@igal-abachi-dev/react-ai-chat-ui/styles.css'

const suggestions: ChatSuggestion[] = [
  {
    label: 'Explain something clearly',
    prompt: 'Explain event sourcing with a practical example.',
  },
  {
    label: 'Review an idea',
    prompt: 'Review my API design and identify its biggest risks.',
  },
]

export function AssistantPage() {
  const [draft, setDraft] = useState('')
  const transport = useMemo(
    () => new DefaultChatTransport({ api: '/api/chat' }),
    [],
  )

  const {
    messages,
    sendMessage,
    status,
    error,
    stop,
    regenerate,
    clearError,
    setMessages,
    addToolApprovalResponse,
  } = useChat({
    id: 'main-assistant',
    transport,
    experimental_throttle: 32,
  })

  return (
    <main style={{ height: '100dvh' }}>
      <ChatSurface
        messages={messages}
        status={status}
        error={error}
        draft={draft}
        onDraftChange={setDraft}
        onSend={(text) => sendMessage({ text })}
        onStop={stop}
        onRegenerate={(messageId) => regenerate({ messageId })}
        onRetry={() => sendMessage()}
        onToolApproval={({ approvalId, approved, reason }) =>
          addToolApprovalResponse({
            id: approvalId,
            approved,
            reason,
          })
        }
        onClearError={clearError}
        onNewChat={() => {
          stop()
          clearError()
          setMessages([])
          setDraft('')
        }}
        assistant={{
          name: 'Assistant',
          subtitle: 'Ask, plan, build',
        }}
        suggestions={suggestions}
      />
    </main>
  )
}
```

Your server route must return the AI SDK UI message stream expected by
`DefaultChatTransport`.

## Controlled by design

`ChatSurface` does not call your API or own conversation persistence. This is
intentional: reusable UI should not choose authentication, tenancy, retry
policy, local storage, routing, or database semantics for the application.

```text
Your hook / state store / router
             │
             ▼
        ChatSurface
        ├── ChatHeader
        ├── ChatMessageList ── TanStack Virtual
        │   └── ChatMessage ── UIMessage.parts
        ├── ChatError
        └── ChatComposer
```

You can also import and compose every lower-level component individually. Wrap
standalone primitives in `ChatUiProvider`; `ChatSurface` includes it already.

### Lightweight subpath imports

Use subpath exports when a screen needs only part of the library. This keeps the
unused transcript, Markdown, or tool-rendering graph out of that entry point:

```tsx
import {
  ChatComposer,
  ChatUiProvider,
} from '@igal-abachi-dev/react-ai-chat-ui/composer'

import {
  ChatMessageList,
  type ChatMessageListHandle,
} from '@igal-abachi-dev/react-ai-chat-ui/messages'

import { ChatMarkdown } from '@igal-abachi-dev/react-ai-chat-ui/markdown'
```

Available subpaths are `./surface`, `./composer`, `./messages`, `./markdown`, and
`./utils`. The root export remains the easiest choice for a complete chat page.

## Product-specific tools and cards

Use `renderPart` to replace the generic renderer for selected AI SDK parts:

```tsx
<ChatSurface
  {...props}
  renderPart={(part, context) => {
    if (part.type === 'data-workout-plan') {
      return <WorkoutPlanCard plan={part.data} />
    }

    if (part.type === 'tool-weather') {
      return <WeatherToolCard part={part} streaming={context.isStreaming} />
    }

    return undefined // use the built-in renderer
  }}
/>
```

Generic tool input/output is collapsed and hidden unless `showToolDetails` is
enabled. Approval-requested parts become actionable Approve/Deny controls when
`onToolApproval` is supplied.

## Older history

```tsx
<ChatSurface
  {...props}
  hasOlder={hasNextPage}
  isLoadingOlder={isFetchingNextPage}
  onLoadOlder={async () => {
    const page = await loadPreviousPage()
    prependMessages(page.messages) // retain original message IDs
    return page.messages.length > 0
  }}
/>
```

The list re-arms loading only after the first message ID changes. TanStack
Virtual keeps the visible content anchored when older messages are prepended.

## Composer controls

The default composer is intentionally a textarea, not Tiptap or Lexical. Plain
text is the correct model for normal chat prompts: it is smaller, easier to
persist, safer on mobile, friendlier to IMEs, and maps directly to AI SDK text
parts.

Use `composerFooterStart` for optional controls without replacing the composer:

```tsx
<ChatSurface
  {...props}
  composerFooterStart={
    <>
      <AttachmentButton />
      <ModelPicker />
    </>
  }
/>
```

Adopt a rich-text editor only when the product truly requires document editing:
formatting marks, tables, embeds, mentions, comments, slash commands,
collaboration, or durable rich JSON.

## Styling and theming

The package ships `dist/styles.css`; consumers do **not** need to scan package
source files with Tailwind.

It understands normal shadcn variables such as `--background`, `--primary`, and
`--border`. Package-prefixed variables take precedence, allowing local theme
overrides without changing the host application:

```css
.my-chat-theme {
  --raic-primary: oklch(0.55 0.2 260);
  --raic-primary-foreground: white;
  --raic-muted: oklch(0.96 0.02 260);
  --raic-radius: 0.8rem;
  --raic-font-sans: Inter, ui-sans-serif, system-ui, sans-serif;
}
```

```tsx
<ChatSurface className="my-chat-theme" {...props} />
```

Place a `.dark` class on an ancestor, or add `raic-dark` to the chat theme, for
dark-mode variants.

## Main API

| Export | Purpose |
|---|---|
| `ChatSurface` | Fully controlled complete chat experience |
| `ChatMessageList` | Virtualized, streaming-aware transcript |
| `ChatMessage` | AI SDK `UIMessage.parts` renderer |
| `ChatMarkdown` | Streamdown wrapper with safe defaults |
| `ChatComposer` | Controlled, mobile/IME-aware textarea composer |
| `ChatHeader` | Assistant identity and conversation actions |
| `ChatEmptyState` | Customizable starter prompts |
| `ChatError` | Retry/dismiss error surface |
| `ChatUiProvider` | Tooltip provider for custom compositions |
| `renderPart` | Escape hatch for domain-specific parts |
| `getMessageText` | Extract text from AI SDK messages |
| `getConversationTranscript` | Build copy/export-friendly plain text |

TypeScript declarations and source maps are included.

## Security model

The built-in renderer:

- does not enable raw Markdown HTML;
- checks protocols for source and file links;
- rejects active HTML/SVG/XML `data:` resources;
- uses `noopener`, `noreferrer`, and no-referrer policies;
- bounds generic tool JSON before rendering;
- keeps raw transport errors out of default user-facing copy.

The application remains responsible for authentication, authorization, safe
tool design, attachment limits, malware scanning, rate limiting, and server-side
validation.

## Package format

This repository uses **Vite library mode** to produce:

```text
dist/
├── index.js
├── surface.js
├── composer.js
├── messages.js
├── markdown.js
├── utils.js
├── styles.css
└── types/
    └── ...
```

The package uses a modern `exports` map and ships ESM only. It intentionally does
not publish a UMD global:

- React and the AI SDK should remain peer dependencies, not bundled globals.
- Vite, Next.js, Remix, Astro, and modern bundlers consume ESM directly.
- A `<script>` CDN build would still require React, portals, CSS, AI SDK runtime,
  and import-map coordination, while offering worse tree-shaking and debugging.

For a no-build website, build a small application wrapper rather than treating a
complex React chat as a single global script.

## Development

```bash
npm ci
npm run check
```

`npm run check` runs type checking, linting, tests, the library build, and an
`npm pack --dry-run` assertion that required distribution files are present.

A runnable Vite example is under `examples/vite`.

## Publishing

The included GitHub Actions workflow supports npm Trusted Publishing and
provenance. See [PUBLISHING.md](./PUBLISHING.md).

Before the first release, confirm that the npm scope `@igal-abachi-dev` belongs
to your npm account. Otherwise, change `name`, repository URLs, and README import
examples together.

## Scope boundaries

Intentionally outside the core package:

- conversation database and sidebar;
- authentication and transport headers;
- attachments and upload security;
- edit/branch semantics;
- voice input/output;
- reconnect stream resumption;
- product-specific cards and charts.

Those layers belong in the application or in optional companion packages.
