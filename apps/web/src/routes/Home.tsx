import type { ReactElement } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { loadLocalOnboarding } from '../lib/onboarding';
import { useAppStore } from '../state/store';

import { computeCurrentStreak } from '@pylearn/core';
import { StreakChip } from '@pylearn/ui-kit';

export function Home(): ReactElement {
  const navigate = useNavigate();
  const { loading, error, session, currentLesson, summary, authStatus, user, setActiveLesson } =
    useAppStore();

  if (loading) {
    return (
      <div className="card mx-auto max-w-3xl p-6">
        <p className="text-sm text-slate-300">Loading your progress…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card mx-auto max-w-3xl space-y-4 p-6">
        <h2 className="text-xl font-semibold text-white">Welcome to PyLearn</h2>
        <p className="text-sm text-red-300" role="alert">
          {error}
        </p>
        <Link to="/tracks" className="btn btn-primary w-fit">
          Browse Tracks
        </Link>
      </div>
    );
  }

  const hasOnboarded =
    authStatus === 'authenticated' ? Boolean(user?.startingLevel) : Boolean(loadLocalOnboarding());

  const resumeLessonId = session?.currentLessonId;
  const canResume = Boolean(resumeLessonId);

  const handleResume = () => {
    if (!resumeLessonId) return;
    setActiveLesson(resumeLessonId);
    navigate(`/lesson/${resumeLessonId}`);
  };

  if (!hasOnboarded) {
    return (
      <div className="card mx-auto max-w-3xl space-y-4 p-6">
        <header className="space-y-2">
          <h2 className="text-2xl font-semibold text-white">Welcome to PyLearn</h2>
          <p className="text-sm text-slate-300">
            Two quick questions get you started in the right place — takes about a minute.
          </p>
        </header>
        <Link to="/onboarding" className="btn btn-primary w-fit">
          Get started
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card mx-auto max-w-3xl space-y-4 p-6">
        <header className="space-y-2">
          <h2 className="text-2xl font-semibold text-white">Welcome to PyLearn</h2>
          <p className="text-sm text-slate-300">Pick up a lesson or continue where you left off.</p>
        </header>
        <div className="flex flex-wrap gap-3">
          <Link to="/tracks" className="btn btn-primary">
            Browse Tracks
          </Link>
          {canResume ? (
            <button type="button" className="btn btn-secondary" onClick={handleResume}>
              Resume {currentLesson ? currentLesson.title : 'last lesson'}
            </button>
          ) : null}
        </div>
      </div>

      {session && session.attempts.length > 0 ? (
        <div className="card mx-auto max-w-3xl space-y-3 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
            <StreakChip streakCount={computeCurrentStreak(session.attempts)} />
          </div>
          <p className="text-sm text-slate-300">
            Attempts logged: {session.attempts.length} · Overall mastery:{' '}
            {summary?.mastery.overallPercent ?? 0}% · Last checkpoint:{' '}
            {session.attempts[session.attempts.length - 1]?.checkpointId ?? 'n/a'}
          </p>
        </div>
      ) : null}
    </div>
  );
}
