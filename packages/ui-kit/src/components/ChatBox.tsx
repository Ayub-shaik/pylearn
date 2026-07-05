import { useState } from 'react';
import type { ReactElement } from 'react';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
}

export interface ChatBoxProps {
  messages: ChatMessage[];
  suggestedPrompts: string[];
  onSend: (_message: string) => void;
  disabled?: boolean;
  loading?: boolean;
}

/**
 * Contextual "Ask AI" chat panel for a checkpoint: predefined prompt chips
 * plus a free-text question, grounded server-side in the current checkpoint.
 */
export function ChatBox({
  messages,
  suggestedPrompts,
  onSend,
  disabled,
  loading,
}: ChatBoxProps): ReactElement {
  const [draft, setDraft] = useState('');

  const handleSend = (message: string) => {
    const trimmed = message.trim();
    if (!trimmed || disabled || loading) return;
    onSend(trimmed);
    setDraft('');
  };

  return (
    <section
      aria-label="Ask AI tutor"
      className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/40 p-4"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Ask AI tutor</p>

      {messages.length > 0 ? (
        <ol className="space-y-2">
          {messages.map((message, index) => (
            <li
              key={index}
              className={`rounded-md px-3 py-2 text-sm ${
                message.role === 'user'
                  ? 'bg-primary/15 text-white'
                  : 'bg-slate-800/80 text-slate-200'
              }`}
            >
              {message.content}
              {message.role === 'assistant' &&
              message.provider &&
              message.provider !== 'template' ? (
                <span className="ml-2 text-xs text-slate-500">({message.provider})</span>
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}

      {loading ? <p className="text-xs text-slate-400">Thinking…</p> : null}

      <div className="flex flex-wrap gap-2">
        {suggestedPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            disabled={disabled || loading}
            onClick={() => handleSend(prompt)}
            className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 transition-colors duration-150 hover:border-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleSend(draft);
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          disabled={disabled || loading}
          placeholder="Ask a question about this checkpoint…"
          className="flex-1 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={disabled || loading || !draft.trim()}
          className="btn btn-secondary"
        >
          Send
        </button>
      </form>
    </section>
  );
}
