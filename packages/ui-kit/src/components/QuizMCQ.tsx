import type { ChangeEvent, FormEvent, ReactElement } from 'react';
import { useEffect, useState } from 'react';

export interface QuizMCQOption {
  id: string;
  text: string;
  isCorrect: boolean;
  whyRight?: string;
  whyWrong?: string;
}

export interface QuizMCQProps {
  questionId: string;
  question: string;
  options: QuizMCQOption[];
  disabled?: boolean;
  initialSelectionId?: string;
  onSelectionChange?: (_selectedId: string | undefined) => void;
  onSubmit: (_selectedId: string) => void;
}

export function QuizMCQ({
  questionId,
  question,
  options,
  disabled,
  initialSelectionId,
  onSelectionChange,
  onSubmit,
}: QuizMCQProps): ReactElement {
  const [selectedId, setSelectedId] = useState<string | undefined>(initialSelectionId);
  const [submittedId, setSubmittedId] = useState<string | undefined>();
  const [verdict, setVerdict] = useState<{ correct: boolean; rationale: string } | null>(null);

  useEffect(() => {
    setSelectedId(initialSelectionId);
    onSelectionChange?.(initialSelectionId);
    // A retry clears the selection back to undefined while keeping the same
    // questionId — without this, submittedId/verdict from the wrong attempt
    // would linger and keep the form permanently locked.
    if (initialSelectionId === undefined) {
      setSubmittedId(undefined);
      setVerdict(null);
    }
  }, [initialSelectionId, onSelectionChange]);

  useEffect(() => {
    setSubmittedId(undefined);
    setVerdict(null);
  }, [questionId]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (submittedId || disabled) return;
    const value = event.target.value;
    setSelectedId(value);
    onSelectionChange?.(value);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedId || disabled) return;

    const option = options.find((item) => item.id === selectedId);
    if (!option) return;

    setSubmittedId(option.id);
    setVerdict({
      correct: option.isCorrect,
      rationale: option.isCorrect
        ? (option.whyRight ?? option.whyWrong ?? '')
        : (option.whyWrong ?? option.whyRight ?? ''),
    });
    onSubmit(option.id);
  };

  const locked = disabled || Boolean(submittedId);

  return (
    <form
      onSubmit={handleSubmit}
      aria-disabled={disabled ?? false}
      data-component="QuizMCQ"
      className="space-y-4"
    >
      <fieldset disabled={locked} className="space-y-3">
        <legend className="text-lg font-semibold text-slate-100">{question}</legend>
        <ul className="space-y-3">
          {options.map((option) => (
            <li
              key={option.id}
              className="rounded-lg border border-slate-800 bg-slate-900/60 transition-colors has-[input:checked]:border-accent/60"
            >
              <label className="flex w-full cursor-pointer gap-3 px-4 py-3 text-sm">
                <input
                  type="radio"
                  name={questionId}
                  value={option.id}
                  checked={selectedId === option.id}
                  onChange={handleChange}
                  disabled={locked}
                  className="mt-1 h-4 w-4 cursor-pointer accent-accent"
                />
                <span className="flex-1 text-slate-200">{option.text}</span>
              </label>
              {submittedId ? (
                <div className="border-t border-slate-800 bg-slate-900/80 px-4 py-2 text-sm text-slate-300">
                  {option.id === submittedId
                    ? verdict?.correct
                      ? `Correct — ${option.whyRight ?? option.whyWrong ?? ''}`
                      : `Incorrect — ${option.whyWrong ?? option.whyRight ?? ''}`
                    : option.isCorrect
                      ? `Why right: ${option.whyRight ?? 'No rationale provided.'}`
                      : `Why wrong: ${option.whyWrong ?? 'No rationale provided.'}`}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={!selectedId || locked}
            className={`btn btn-primary ${locked ? 'opacity-70' : ''}`}
          >
            {submittedId ? 'Submitted' : 'Submit'}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
