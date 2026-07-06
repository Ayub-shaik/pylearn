import { useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';

import { RoadmapSidebar } from '../components/RoadmapSidebar';
import { LEARNING_GOAL_OPTIONS, loadLocalOnboarding } from '../lib/onboarding';
import { Spinner } from '../lib/Spinner';
import { useAppStore } from '../state/store';

import { buildRoadmapView, computeCurrentStreak } from '@pylearn/core';
import type { Module } from '@pylearn/core';
import { LessonCard, StreakChip } from '@pylearn/ui-kit';

export function Tracks(): ReactElement {
  const navigate = useNavigate();
  const { track, loading, error, attempts, session, summary, authStatus, user, setActiveLesson } =
    useAppStore();

  const [manualSelectedModuleId, setManualSelectedModuleId] = useState<string | undefined>();

  const roadmap = useMemo(() => {
    if (!track || !session) return undefined;
    return buildRoadmapView(track, session);
  }, [track, session]);

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

  if (!track || !roadmap) {
    return (
      <div className="card mx-auto max-w-4xl p-6">
        <h2 className="text-xl font-semibold text-white">Tracks</h2>
        <p className="text-sm text-slate-300">No track data available.</p>
      </div>
    );
  }

  const totalCheckpoints = track.modules.reduce<number>((count, module: Module) => {
    const moduleTotal = module.lessons.reduce<number>(
      (lessonTotal, lesson) => lessonTotal + lesson.checkpoints.length,
      0,
    );
    return count + moduleTotal;
  }, 0);

  const currentModuleId = roadmap.modules.find((m) =>
    m.lessons.some((l) => l.lesson.id === session?.currentLessonId),
  )?.module.id;
  const selectedModuleId =
    manualSelectedModuleId ?? currentModuleId ?? roadmap.modules[0]?.module.id;
  const selectedModule = roadmap.modules.find((m) => m.module.id === selectedModuleId);

  const handleSelectLesson = (lessonId: string) => {
    setActiveLesson(lessonId);
    navigate(`/lesson/${lessonId}`);
  };

  const learningGoal =
    authStatus === 'authenticated' ? user?.learningGoal : loadLocalOnboarding()?.learningGoal;
  const learningGoalLabel = LEARNING_GOAL_OPTIONS.find((o) => o.value === learningGoal)?.label;

  return (
    <div className="space-y-6">
      <div className="card space-y-3 p-6">
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

      <div className="grid gap-6 md:grid-cols-[16rem_1fr]">
        <RoadmapSidebar
          view={roadmap}
          selectedModuleId={selectedModuleId}
          activeLessonId={session?.currentLessonId}
          onSelectModule={setManualSelectedModuleId}
          onSelectLesson={handleSelectLesson}
        />

        {selectedModule ? (
          <section className="card space-y-4 p-6">
            <header>
              <h3 className="text-xl font-semibold text-white">{selectedModule.module.title}</h3>
              <p className="mt-1 text-sm text-slate-300">{selectedModule.module.summary}</p>
            </header>
            <ul className="space-y-3">
              {selectedModule.lessons.map((lessonView) => (
                <li key={lessonView.lesson.id}>
                  <LessonCard
                    lessonId={lessonView.lesson.id}
                    title={lessonView.lesson.title}
                    summary={lessonView.lesson.summary}
                    durationMinutes={lessonView.lesson.durationMinutes}
                    progressPercent={lessonView.progressPercent}
                    isActive={session?.currentLessonId === lessonView.lesson.id}
                    onSelectLesson={handleSelectLesson}
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
