import type { ReactElement, HTMLAttributes } from 'react';

export interface ResultExplainerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  checkpointId: string;
  lessonId: string;
  isCorrect: boolean;
  explanation: string;
  hintsUsed: number;
  durationSeconds?: number;
  onReviewLesson?: (_lessonId: string) => void;
}

/**
 * Display the rationale behind an evaluated attempt for the learner.
 * @todo TODO(impl): Replace placeholder markup with structured explanation UI.
 */
export function ResultExplainer({
  checkpointId,
  lessonId: _lessonId,
  isCorrect,
  explanation,
  hintsUsed,
  durationSeconds,
  onReviewLesson,
  onClick,
  'aria-label': ariaLabel,
  ...rest
}: ResultExplainerProps): ReactElement {
  return (
    <div
      {...rest}
      role="status"
      data-component="ResultExplainer"
      data-checkpoint-id={checkpointId}
      data-lesson-id={_lessonId}
      data-correct={isCorrect}
      data-hints-used={hintsUsed}
      data-duration={durationSeconds ?? undefined}
      aria-live="polite"
      aria-label={ariaLabel ?? 'Result explanation'}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          onReviewLesson?.(_lessonId);
        }
      }}
    >
      {isCorrect ? 'Correct' : 'Incorrect'} — {explanation}
    </div>
  );
}
