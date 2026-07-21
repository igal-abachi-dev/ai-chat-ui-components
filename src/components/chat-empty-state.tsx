import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Bot, Lightbulb, ListTodo, SearchCheck, SquarePen } from 'lucide-react'
import { Button } from '../ui/button'

export interface ChatSuggestion {
  label: string
  prompt: string
  icon?: LucideIcon
}

const DEFAULT_CHAT_SUGGESTIONS: ChatSuggestion[] = [
  {
    label: 'Explain a topic clearly',
    prompt: 'Explain a useful topic step by step, with a practical example.',
    icon: Lightbulb,
  },
  {
    label: 'Help me make a plan',
    prompt: 'Help me turn my goal into a clear, realistic action plan.',
    icon: ListTodo,
  },
  {
    label: 'Review an idea',
    prompt: 'Review an idea with strengths, risks, and concrete improvements.',
    icon: SearchCheck,
  },
  {
    label: 'Draft something useful',
    prompt: 'Help me draft a polished message or document from a few notes.',
    icon: SquarePen,
  },
]

export interface ChatEmptyStateProps {
  onSuggestion: (prompt: string) => void
  suggestions?: ChatSuggestion[]
  title?: string
  description?: string
  icon?: ReactNode
}

/** Zero-message state with replaceable, full-prompt starter actions. */
export function ChatEmptyState({
  onSuggestion,
  suggestions = DEFAULT_CHAT_SUGGESTIONS,
  title = 'How can I help?',
  description =
    'Ask a question, make a plan, review an idea, or start with one of these suggestions.',
  icon,
}: ChatEmptyStateProps) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-4 py-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center text-center">
        <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
          {icon ?? <Bot className="size-7" aria-hidden />}
        </div>
        <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        <p className="mt-3 max-w-xl text-pretty text-sm leading-6 text-muted-foreground sm:text-base">
          {description}
        </p>

        {suggestions.length > 0 && (
          <div className="mt-8 grid w-full gap-2 sm:grid-cols-2">
            {suggestions.map(({ label, prompt, icon: Icon }) => (
              <Button
                key={`${label}:${prompt}`}
                type="button"
                variant="outline"
                className="h-auto min-h-14 justify-start rounded-2xl px-4 py-3 text-start font-normal"
                onClick={() => onSuggestion(prompt)}
              >
                {Icon && (
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                )}
                <span className="whitespace-normal leading-5">{label}</span>
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
