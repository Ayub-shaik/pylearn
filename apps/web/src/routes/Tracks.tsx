import type { ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';

import { LEARNING_GOAL_OPTIONS, loadLocalOnboarding } from '../lib/onboarding';
import { Spinner } from '../lib/Spinner';
import { useAppStore } from '../state/store';

import { computeCurrentStreak } from '@pylearn/core';
import type { Lesson, Module } from '@pylearn/core';
import { LessonCard, StreakChip } from '@pylearn/ui-kit';

export function Tracks(): ReactElement {
  const navigate = useNavigate();
  const { track, loading, error, attempts, session, summary, authStatus, user, setActiveLesson } =
    useAppStore();

  if (loading) {
    return (
      <div className="card mx-auto max-w-4xl p-6">
        <Spinner label="Loading curriculum…" />
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

  const attemptedCheckpointIds = new Set(attempts.map((attempt) => attempt.checkpointId));
  const lessonProgress = (lesson: Lesson): number => {
    if (lesson.checkpoints.length === 0) return 0;
    const done = lesson.checkpoints.filter((checkpoint) =>
      attemptedCheckpointIds.has(checkpoint.id),
    ).length;
    return Math.round((done / lesson.checkpoints.length) * 100);
  };

  const handleSelectLesson = (lessonId: string) => {
    setActiveLesson(lessonId);
    navigate(`/lesson/${lessonId}`);
  };

  const learningGoal =
    authStatus === 'authenticated' ? user?.learningGoal : loadLocalOnboarding()?.learningGoal;
  const learningGoalLabel = LEARNING_GOAL_OPTIONS.find((o) => o.value === learningGoal)?.label;

  return (
    <div className="space-y-6">
      <div className="card mx-auto max-w-4xl space-y-3 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold text-white">{track.title}</h2>
          <StreakChip streakCount={computeCurrentStreak(attempts)} />
        </div>
        <p className="text-sm text-slate-300">{track.summary}</p>
        {learningGoalLabel ? (
          <p className="text-xs text-slate-500">
            Recommended for: {learningGoalLabel} — more goal-specific tracks are coming; everyone
            takes Python Basics for now.
          </p>
        ) : null}
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Checkpoints completed: {attempts.length} / {totalCheckpoints} · Overall mastery:{' '}
          {summary?.mastery.overallPercent ?? 0}%
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
              <li key={lesson.id}>
                <LessonCard
                  lessonId={lesson.id}
                  title={lesson.title}
                  summary={lesson.summary}
                  durationMinutes={lesson.durationMinutes}
                  progressPercent={lessonProgress(lesson)}
                  isActive={session?.currentLessonId === lesson.id}
                  onSelectLesson={handleSelectLesson}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
