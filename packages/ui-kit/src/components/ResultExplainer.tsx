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
 */
export function ResultExplainer({
  checkpointId,
  lessonId,
  isCorrect,
  explanation,
  hintsUsed,
  durationSeconds,
  onReviewLesson,
  onClick,
  className,
  'aria-label': ariaLabel,
  ...rest
}: ResultExplainerProps): ReactElement {
  return (
    <div
      {...rest}
      role="status"
      data-component="ResultExplainer"
      data-checkpoint-id={checkpointId}
      data-lesson-id={lessonId}
      data-correct={isCorrect}
      data-hints-used={hintsUsed}
      data-duration={durationSeconds ?? undefined}
      aria-live="polite"
      aria-label={ariaLabel ?? 'Result explanation'}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          onReviewLesson?.(lessonId);
        }
      }}
      className={`space-y-1 rounded-md border px-4 py-3 text-sm ${
        isCorrect
          ? 'border-emerald-500/30 bg-emerald-900/20 text-emerald-100'
          : 'border-red-500/30 bg-red-900/20 text-red-100'
      } ${onReviewLesson ? 'cursor-pointer' : ''} ${className ?? ''}`}
    >
      <p className="font-medium">
        {isCorrect ? '✅ Correct' : '❌ Incorrect'} · {lessonId} / {checkpointId}
      </p>
      <p className="text-slate-200/90">{explanation}</p>
      {hintsUsed > 0 ? (
        <p className="text-xs text-slate-400">
          {hintsUsed} hint{hintsUsed === 1 ? '' : 's'} used
        </p>
      ) : null}
    </div>
  );
}
