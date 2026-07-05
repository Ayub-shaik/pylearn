import type { ChangeEventHandler, FormEvent, ReactElement } from 'react';
import { useCallback } from 'react';

export interface FillBlankProps {
  questionId: string;
  prompt: string;
  value: string;
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  onSubmitAnswer?: (_payload: { questionId: string; value: string }) => void;
}

export function FillBlank({
  questionId,
  prompt,
  value,
  placeholder,
  autoFocus,
  disabled,
  onChange,
  onSubmitAnswer,
}: FillBlankProps): ReactElement {
  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!disabled) {
        onSubmitAnswer?.({ questionId, value });
      }
    },
    [disabled, onSubmitAnswer, questionId, value],
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-2"
      data-component="FillBlank"
      aria-disabled={disabled ?? false}
    >
      <label htmlFor={questionId} className="block text-sm font-medium text-slate-300">
        {prompt}
      </label>
      <input
        id={questionId}
        name={questionId}
        type="text"
        value={value}
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={disabled}
        onChange={onChange}
        className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <div className="flex justify-end">
        <button type="submit" className="btn btn-primary" disabled={disabled}>
          Submit
        </button>
      </div>
    </form>
  );
}
