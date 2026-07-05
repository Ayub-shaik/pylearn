import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { useAppStore } from '../state/store';

export function Review(): ReactElement {
  const { loading, error, track, summary, attempts } = useAppStore();

  if (loading) {
    return (
      <div className="card mx-auto max-w-3xl p-6">
        <p className="text-sm text-slate-300">Preparing summary…</p>
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

  return (
    <div className="space-y-6">
      <div className="card mx-auto max-w-3xl space-y-2 p-6">
        <h2 className="text-2xl font-semibold text-white">Review Summary</h2>
        <p className="text-sm text-slate-400">{track.title}</p>
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Total checkpoints completed: {attempts.length}
        </p>
      </div>

      <div className="card mx-auto max-w-3xl p-6">
        {attempts.length === 0 ? (
          <p className="text-sm text-slate-300">No attempts logged so far.</p>
        ) : (
          <ol className="space-y-2 text-sm text-slate-200">
            {attempts.map((attempt) => (
              <li
                key={`${attempt.lessonId}-${attempt.checkpointId}-${attempt.timestamp}`}
                className="rounded-md border border-slate-800 bg-slate-900/70 px-4 py-2"
              >
                <strong>{attempt.lessonId}</strong> — {attempt.checkpointId} ·{' '}
                {attempt.isCorrect ? 'Correct' : 'Incorrect'}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
