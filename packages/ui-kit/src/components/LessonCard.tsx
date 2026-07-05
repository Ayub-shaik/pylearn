import type { ReactElement, HTMLAttributes, MouseEvent } from 'react';

export interface LessonCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
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
  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    onClick?.(event);
    if (!event.defaultPrevented) {
      onSelectLesson?.(lessonId);
    }
  };

  return (
    <div
      {...rest}
      role="group"
      tabIndex={0}
      data-component="LessonCard"
      data-lesson-id={lessonId}
      data-active={isActive ?? false}
      data-progress={progressPercent ?? undefined}
      data-duration={durationMinutes ?? undefined}
      aria-label={ariaLabel ?? `Lesson ${title}`}
      onClick={handleClick}
      onFocus={onFocus}
      onBlur={onBlur}
      className={`flex cursor-pointer items-center justify-between gap-4 rounded-lg border px-4 py-3 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary ${
        isActive
          ? 'border-primary bg-primary/10'
          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
      } ${className ?? ''}`}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-white">{title}</p>
        <p className="mt-0.5 truncate text-xs text-slate-400">{summary}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3 text-xs text-slate-400">
        {typeof progressPercent === 'number' ? (
          <span className="rounded-full bg-slate-800 px-2 py-1 font-medium text-slate-200">
            {progressPercent}%
          </span>
        ) : null}
        {typeof durationMinutes === 'number' ? <span>{durationMinutes} min</span> : null}
      </div>
    </div>
  );
}
