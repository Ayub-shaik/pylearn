import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { Spinner } from '../lib/Spinner';
import { useAppStore } from '../state/store';

import { computeCurrentStreak, resolveCheckpoint } from '@pylearn/core';
import type { Attempt, Checkpoint, Track } from '@pylearn/core';
import { ResultExplainer, StreakChip } from '@pylearn/ui-kit';

export function Review(): ReactElement {
  const { loading, error, track, summary, attempts } = useAppStore();

  if (loading) {
    return (
      <div className="card mx-auto max-w-3xl p-6">
        <Spinner label="Preparing summary…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card mx-auto max-w-3xl space-y-4 p-6">
        <h2 className="text-xl font-semibold text-white">Review</h2>
        <p className="text-sm text-red-300" role="alert">
          {error}
        </p>
      </div>
    );
  }

  if (!track || !summary) {
    return (
      <div className="card mx-auto max-w-3xl p-6">
        <h2 className="text-xl font-semibold text-white">Review</h2>
        <p className="text-sm text-slate-300">
          No progress recorded yet. Start a{' '}
          <Link className="text-primary" to="/tracks">
            lesson
          </Link>
          .
        </p>
      </div>
    );
  }

  const streak = computeCurrentStreak(attempts);

  return (
    <div className="space-y-6">
      <div className="card mx-auto max-w-3xl space-y-3 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-white">Review Summary</h2>
            <p className="text-sm text-slate-400">{track.title}</p>
          </div>
          <StreakChip streakCount={streak} />
        </div>
        <div className="flex flex-wrap gap-4 text-xs uppercase tracking-wide text-slate-500">
          <span>Checkpoints completed: {attempts.length}</span>
          <span>Overall mastery: {summary.mastery.overallPercent}%</span>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-3">
        {attempts.length === 0 ? (
          <div className="card p-6">
            <p className="text-sm text-slate-300">No attempts logged so far.</p>
          </div>
        ) : (
          [...attempts]
            .reverse()
            .map((attempt) => (
              <ResultExplainer
                key={`${attempt.lessonId}-${attempt.checkpointId}-${attempt.timestamp}`}
                checkpointId={attempt.checkpointId}
                lessonId={attempt.lessonId}
                isCorrect={attempt.isCorrect}
                explanation={explainAttempt(track, attempt)}
                hintsUsed={attempt.revealsUsed}
              />
            ))
        )}
      </div>
    </div>
  );
}

function explainAttempt(track: Track, attempt: Attempt): string {
  const checkpoint = resolveCheckpoint(track, {
    lessonId: attempt.lessonId,
    checkpointId: attempt.checkpointId,
  });
  if (!checkpoint) return 'Checkpoint content is unavailable.';
  return checkpointExplanation(checkpoint, attempt);
}

function checkpointExplanation(checkpoint: Checkpoint, attempt: Attempt): string {
  switch (checkpoint.type) {
    case 'quiz-mcq': {
      const option = checkpoint.options.find((item) => item.id === attempt.selectedOptionId);
      if (!option) return checkpoint.explanation;
      return attempt.isCorrect
        ? (option.whyRight ?? option.explanation)
        : (option.whyWrong ?? option.explanation);
    }
    case 'fill-blank':
    case 'code-cell':
    case 'note':
    default:
      return checkpoint.explanation;
  }
}
