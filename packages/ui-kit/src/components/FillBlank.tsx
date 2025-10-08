import type { ReactElement, HTMLAttributes } from 'react';

export interface FillBlankProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  questionId: string;
  prompt: string;
  value: string;
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  onSubmitAnswer?: (_payload: { questionId: string; value: string }) => void;
}

/**
 * Collect a short text response for fill-in-the-blank checkpoints.
 * @todo TODO(impl): Replace placeholder markup with interactive input UI.
 */
export function FillBlank({
  questionId,
  prompt,
  value,
  placeholder,
  autoFocus,
  disabled,
  onSubmitAnswer,
  onClick,
  onKeyDown,
  'aria-label': ariaLabel,
  ...rest
}: FillBlankProps): ReactElement {
  const handleSubmit = () => {
    if (!disabled) {
      onSubmitAnswer?.({ questionId, value });
    }
  };

  return (
    <div
      {...rest}
      role="group"
      data-component="FillBlank"
      data-question-id={questionId}
      data-autofocus={autoFocus ?? false}
      aria-disabled={disabled ?? false}
      aria-label={ariaLabel ?? `Fill in the blank: ${prompt}`}
      data-placeholder={placeholder ?? ''}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          handleSubmit();
        }
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.key === 'Enter' && !event.defaultPrevented) {
          handleSubmit();
        }
      }}
    >
      {prompt} — {value || placeholder || '...'}
    </div>
  );
}
