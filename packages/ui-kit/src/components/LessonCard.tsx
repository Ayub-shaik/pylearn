import type { ReactElement, ButtonHTMLAttributes, MouseEvent } from 'react';

export interface LessonCardProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  lessonId: string;
  title: string;
  summary: string;
  durationMinutes?: number;
  progressPercent?: number;
  isActive?: boolean;
  onSelectLesson?: (_lessonId: string) => void;
}

/**
 * Present summary metadata for a lesson the learner can pick.
 */
export function LessonCard({
  lessonId,
  title,
  summary,
  durationMinutes,
  progressPercent,
  isActive,
  onSelectLesson,
  onFocus,
  onBlur,
  onClick,
  className,
  'aria-label': ariaLabel,
  ...rest
}: LessonCardProps): ReactElement {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (!event.defaultPrevented) {
      onSelectLesson?.(lessonId);
    }
  };

  return (
    <button
      {...rest}
      type="button"
      data-component="LessonCard"
      data-lesson-id={lessonId}
      data-active={isActive ?? false}
      data-progress={progressPercent ?? undefined}
      data-duration={durationMinutes ?? undefined}
      aria-label={ariaLabel ?? `Lesson ${title}`}
      onClick={handleClick}
      onFocus={onFocus}
      onBlur={onBlur}
      className={`flex w-full cursor-pointer items-center justify-between gap-4 rounded-lg border-l-2 border-y border-r px-4 py-3 text-left transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-accent ${
        isActive
          ? 'border-y-slate-800 border-l-accent border-r-slate-800 bg-accent/10'
          : 'border-slate-800 bg-slate-900/60 hover:border-l-slate-600 hover:bg-slate-900'
      } ${className ?? ''}`}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-white">{title}</p>
        <p className="mt-0.5 truncate text-xs text-slate-400">{summary}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3 font-mono text-xs text-slate-400">
        {typeof progressPercent === 'number' ? (
          <span className="rounded-full bg-slate-800 px-2 py-1 font-medium text-accent-light">
            {progressPercent}%
          </span>
        ) : null}
        {typeof durationMinutes === 'number' ? <span>{durationMinutes} min</span> : null}
      </div>
    </button>
  );
}
