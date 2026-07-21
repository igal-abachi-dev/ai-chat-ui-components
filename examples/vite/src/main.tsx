/* eslint-disable react-refresh/only-export-components */
import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import type { ChatStatus, UIMessage } from 'ai'
import { ChatSurface } from '@igal-abachi-dev/react-ai-chat-ui'
import '@igal-abachi-dev/react-ai-chat-ui/styles.css'
import './styles.css'

const initialMessages: UIMessage[] = [
  {
    id: 'assistant-welcome',
    role: 'assistant',
    parts: [
      {
        type: 'text',
        text: 'Hello! This example simulates a streamed **Markdown** response.',
      },
    ],
  },
]

function Demo() {
  const [messages, setMessages] = useState<UIMessage[]>(initialMessages)
  const [draft, setDraft] = useState('')
  const [status, setStatus] = useState<ChatStatus>('ready')

  const send = async (text: string) => {
    const user: UIMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      parts: [{ type: 'text', text }],
    }
    const assistantId = crypto.randomUUID()
    const answer =
      'This local demo shows the reusable UI. Connect `ChatSurface` to `useChat` and `DefaultChatTransport` in your application.'

    setMessages((current) => [...current, user])
    setStatus('submitted')
    await new Promise((resolve) => setTimeout(resolve, 350))
    setMessages((current) => [
      ...current,
      { id: assistantId, role: 'assistant', parts: [{ type: 'text', text: '' }] },
    ])
    setStatus('streaming')

    for (let length = 1; length <= answer.length; length += 3) {
      await new Promise((resolve) => setTimeout(resolve, 12))
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                parts: [{ type: 'text', text: answer.slice(0, length) }],
              }
            : message,
        ),
      )
    }

    setStatus('ready')
  }

  return (
    <div className="demo-shell">
      <ChatSurface
        messages={messages}
        status={status}
        draft={draft}
        onDraftChange={setDraft}
        onSend={send}
        onNewChat={() => {
          setMessages([])
          setDraft('')
          setStatus('ready')
        }}
        assistant={{ name: 'Demo assistant', subtitle: 'Local fake stream' }}
      />
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Demo />
  </StrictMode>,
)
