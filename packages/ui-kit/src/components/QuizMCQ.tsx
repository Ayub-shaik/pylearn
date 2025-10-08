import type { ReactElement, HTMLAttributes } from 'react';

export interface QuizMCQOption {
  id: string;
  label: string;
  detail?: string;
  disabled?: boolean;
}

export interface QuizMCQProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onChange'> {
  questionId: string;
  prompt: string;
  options: QuizMCQOption[];
  selectedOptionId?: string;
  disabled?: boolean;
  onSelectOption?: (_optionId: string) => void;
}

/**
 * Render a multiple-choice question container with accessible wiring.
 * @todo TODO(impl): Replace placeholder markup with interactive option UI.
 */
export function QuizMCQ({
  questionId,
  prompt,
  options,
  selectedOptionId,
  disabled,
  onSelectOption,
  onClick,
  'aria-label': ariaLabel,
  ...rest
}: QuizMCQProps): ReactElement {
  const handleClick = () => {
    if (!disabled && selectedOptionId && onSelectOption) {
      onSelectOption(selectedOptionId);
    }
  };

  return (
    <div
      {...rest}
      role="radiogroup"
      data-component="QuizMCQ"
      data-question-id={questionId}
      aria-disabled={disabled ?? false}
      aria-label={ariaLabel ?? `Question: ${prompt}`}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          handleClick();
        }
      }}
    >
      {prompt} ({options.length} options)
    </div>
  );
}
