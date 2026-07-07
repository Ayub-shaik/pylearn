import { useMemo } from 'react';
import type { ReactElement } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { RoadmapPreview } from '../components/RoadmapPreview';
import { loadLocalOnboarding } from '../lib/onboarding';
import { Spinner } from '../lib/Spinner';
import { useAppStore } from '../state/store';

import { buildRoadmapView, computeCurrentStreak } from '@pylearn/core';
import type { RoadmapModuleView } from '@pylearn/core';
import { ProgressRing, StreakChip } from '@pylearn/ui-kit';

const MODULE_ICON: Record<RoadmapModuleView['status'], string> = {
  completed: '✔',
  current: '▶',
  locked: '🔒',
  available: '📘',
};

export function Home(): ReactElement {
  const navigate = useNavigate();
  const {
    loading,
    error,
    session,
    currentLesson,
    summary,
    authStatus,
    user,
    setActiveLesson,
    track,
  } = useAppStore();

  const roadmap = useMemo(() => {
    if (!track || !session) return undefined;
    return buildRoadmapView(track, session);
  }, [track, session]);

  if (loading) {
    return (
      <div className="card mx-auto max-w-3xl p-6">
        <Spinner label="Loading your progress…" />
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
      <div className="space-y-8">
        <div className="card mx-auto max-w-3xl space-y-5 p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-light">
            No signup required
          </p>
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">
            Start learning Python right now — check your knowledge, or learn from scratch.
          </h2>
          <p className="mx-auto max-w-xl text-sm text-slate-300 sm:text-base">
            Jump straight into hands-on checkpoints — multiple choice, fill-in-the-blank, and code
            you actually run — with an AI tutor that explains why an answer is right or wrong, not
            just what the answer is. No account, no email, no wall — start now, and save your
            progress later only if you want to.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link to="/onboarding" className="btn btn-primary">
              Start now — no signup
            </Link>
            <Link to="/tracks" className="btn btn-secondary">
              Browse lessons first
            </Link>
          </div>
        </div>

        <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
          <FeatureCard
            title="Practice, not just reading"
            description="Every lesson ends in a checkpoint you actually solve — a quiz, a fill-in-the-blank, or real code you run yourself."
          />
          <FeatureCard
            title="Hints that escalate, answers that explain"
            description="Stuck? Hints get more specific step by step. Every result tells you why it's right or wrong, with examples."
          />
          <FeatureCard
            title="A self-hosted AI tutor"
            description="Ask a follow-up question in plain language, right on the checkpoint you're stuck on — powered by a small model we run ourselves, never a paid third-party API."
          />
          <FeatureCard
            title="Progress that follows you"
            description="Sign in with Google and pick up on any device. Prefer not to? Just start — progress saves to this browser."
          />
        </div>

        <div className="card mx-auto max-w-3xl space-y-4 p-6">
          <h3 className="text-lg font-semibold text-white">How it works</h3>
          <ol className="space-y-3 text-sm text-slate-300">
            <li>
              <span className="font-medium text-white">1. Tell us where you're starting from.</span>{' '}
              Two quick questions place you at the right lesson.
            </li>
            <li>
              <span className="font-medium text-white">2. Work through a checkpoint.</span> Answer,
              run code, or fill in the blank — no passive reading.
            </li>
            <li>
              <span className="font-medium text-white">3. Get instant, specific feedback.</span>{' '}
              Wrong answers explain why and let you try again — you're never just waved on to the
              next question.
            </li>
            <li>
              <span className="font-medium text-white">4. Ask when you're stuck.</span> Escalating
              hints, or ask the AI tutor a direct question about exactly what you're looking at.
            </li>
          </ol>
        </div>

        <RoadmapPreview />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card mx-auto max-w-3xl space-y-4 p-6">
        <header className="space-y-2">
          <h2 className="text-2xl font-semibold text-white">Welcome back to PyLearn</h2>
          <p className="text-sm text-slate-300">
            You're learning Python through hands-on checkpoints, not passive reading. Pick up a
            lesson, continue where you left off, or see the full roadmap below.
          </p>
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
          <Link
            to="/settings"
            className="ml-auto self-center text-xs text-slate-500 underline hover:text-slate-300"
          >
            Start over / reset progress
          </Link>
        </div>
      </div>

      {roadmap ? (
        <div className="card mx-auto max-w-3xl space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Your Python roadmap</h3>
              <p className="text-sm text-slate-400">{roadmap.track.title}</p>
            </div>
            <ProgressRing value={roadmap.overallProgressPercent} max={100} size={48} />
          </div>
          <ul className="space-y-2">
            {roadmap.modules.map((moduleView) => (
              <li
                key={moduleView.module.id}
                className="flex items-center justify-between gap-3 rounded-md border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2 text-slate-200">
                  <span aria-hidden="true">{MODULE_ICON[moduleView.status]}</span>
                  {moduleView.module.title}
                </span>
                <span className="text-xs text-slate-400">{moduleView.progressPercent}%</span>
              </li>
            ))}
          </ul>
          <Link to="/tracks" className="text-sm text-primary-light underline">
            View full roadmap →
          </Link>
        </div>
      ) : null}

      <RoadmapPreview />

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

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="card space-y-2 p-5">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="text-sm text-slate-400">{description}</p>
    </div>
  );
}
