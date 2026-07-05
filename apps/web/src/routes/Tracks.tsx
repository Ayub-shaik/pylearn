import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { useAppStore } from '../state/store';

import type { Lesson, Module } from '@pylearn/core';

export function Tracks(): ReactElement {
  const { track, loading, error, attempts, setActiveLesson } = useAppStore();

  if (loading) {
    return (
      <div className="card mx-auto max-w-4xl p-6">
        <p className="text-sm text-slate-300">Loading curriculum…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card mx-auto max-w-4xl space-y-4 p-6">
        <h2 className="text-xl font-semibold text-white">Tracks</h2>
        <p className="text-sm text-red-300" role="alert">
          {error}
        </p>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="card mx-auto max-w-4xl p-6">
        <h2 className="text-xl font-semibold text-white">Tracks</h2>
        <p className="text-sm text-slate-300">No track data available.</p>
      </div>
    );
  }

  const totalCheckpoints = track.modules.reduce<number>((count, module: Module) => {
    const moduleTotal = module.lessons.reduce<number>(
      (lessonTotal, lesson: Lesson) => lessonTotal + lesson.checkpoints.length,
      0,
    );
    return count + moduleTotal;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="card mx-auto max-w-4xl space-y-3 p-6">
        <h2 className="text-2xl font-semibold text-white">{track.title}</h2>
        <p className="text-sm text-slate-300">{track.summary}</p>
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Checkpoints completed: {attempts.length} / {totalCheckpoints}
        </p>
      </div>

      {track.modules.map((module) => (
        <section key={module.id} className="card mx-auto max-w-4xl space-y-4 p-6">
          <header>
            <h3 className="text-xl font-semibold text-white">{module.title}</h3>
            <p className="mt-1 text-sm text-slate-300">{module.summary}</p>
          </header>
          <ul className="space-y-3">
            {module.lessons.map((lesson) => (
              <li
                key={lesson.id}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-white">{lesson.title}</p>
                  <p className="text-xs text-slate-400">{lesson.summary}</p>
                </div>
                <Link
                  to={`/lesson/${lesson.id}`}
                  onClick={() => setActiveLesson(lesson.id)}
                  className="btn btn-secondary"
                >
                  Start lesson
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
