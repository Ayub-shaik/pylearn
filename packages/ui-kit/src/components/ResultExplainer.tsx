import type { HTMLAttributes, MouseEventHandler, ReactElement } from 'react';

export interface ResultExplainerProps
  extends Omit<HTMLAttributes<HTMLDivElement | HTMLButtonElement>, 'children' | 'onClick'> {
  checkpointId: string;
  lessonId: string;
  /** Human-readable label shown instead of the raw lessonId/checkpointId, when known. */
  displayLabel?: string;
  isCorrect: boolean;
  explanation: string;
  hintsUsed: number;
  durationSeconds?: number;
  onReviewLesson?: (_lessonId: string) => void;
  onClick?: MouseEventHandler<HTMLDivElement | HTMLButtonElement>;
}

/**
 * Display the rationale behind an evaluated attempt for the learner.
 */
export function ResultExplainer({
  checkpointId,
  lessonId,
  displayLabel,
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
  const sharedClassName = `w-full space-y-1 rounded-md border px-4 py-3 text-left text-sm ${
    isCorrect
      ? 'border-emerald-500/30 bg-emerald-900/20 text-emerald-100'
      : 'border-red-500/30 bg-red-900/20 text-red-100'
  } ${className ?? ''}`;

  const body = (
    <>
      <p className="font-mono font-medium">
        {isCorrect ? '✅ Correct' : '❌ Incorrect'} ·{' '}
        {displayLabel ?? `${lessonId} / ${checkpointId}`}
      </p>
      <p className="text-slate-200/90">{explanation}</p>
      {hintsUsed > 0 ? (
        <p className="terminal-label">
          {hintsUsed} hint{hintsUsed === 1 ? '' : 's'} used
        </p>
      ) : null}
    </>
  );

  // A row the learner can jump back into its lesson from needs to be a real
  // interactive control (keyboard + screen reader operable), not just a div
  // with an onClick — role="status" on a clickable element is also the
  // wrong semantics (that's for a live-updating announcement, not a button).
  if (onReviewLesson) {
    return (
      <button
        {...rest}
        type="button"
        data-component="ResultExplainer"
        data-checkpoint-id={checkpointId}
        data-lesson-id={lessonId}
        data-correct={isCorrect}
        data-hints-used={hintsUsed}
        data-duration={durationSeconds ?? undefined}
        aria-label={ariaLabel ?? 'Result explanation'}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) {
            onReviewLesson(lessonId);
          }
        }}
        className={`cursor-pointer transition-colors duration-150 hover:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent ${sharedClassName}`}
      >
        {body}
      </button>
    );
  }

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
      className={sharedClassName}
    >
      {body}
    </div>
  );
}
