import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';

import {
  type AuthUser,
  getMe,
  googleSignInUrl,
  getSession as getRemoteSession,
  logout as remoteLogout,
  resetModuleRemote,
  submitAttemptRemote,
} from '../lib/api';
import { clearSessionState, loadSessionState, saveSessionState } from '../lib/db';
import { clearLocalOnboarding, loadLocalOnboarding } from '../lib/onboarding';

import {
  type Attempt,
  type Checkpoint,
  type CheckpointRef,
  type HintStage,
  type Lesson,
  type SessionState,
  type SessionSummary,
  type SubmissionFeedback,
  type SubmissionOutcome,
  type Track,
  firstUnattemptedCheckpointInLesson,
  getSummary,
  reconcileSessionCursor,
  recommendedStartingLessonId,
  resetModuleProgress,
  startSession,
  submitAnswer,
} from '@pylearn/core';
import lessonGettingStartedJson from '@pylearn/data/content/python-basics/lesson-000-getting-started.json';
import lessonVariablesJson from '@pylearn/data/content/python-basics/lesson-001-variables.json';
import lessonTypesJson from '@pylearn/data/content/python-basics/lesson-002-types.json';
import lessonOperatorsJson from '@pylearn/data/content/python-basics/lesson-003-operators.json';
import lessonStringsJson from '@pylearn/data/content/python-basics/lesson-004-strings.json';
import lessonIoJson from '@pylearn/data/content/python-basics/lesson-005-io.json';
import lessonConditionalsJson from '@pylearn/data/content/python-basics/lesson-006-conditionals.json';
import lessonLoopsJson from '@pylearn/data/content/python-basics/lesson-007-loops.json';
import lessonFunctionsJson from '@pylearn/data/content/python-basics/lesson-008-functions.json';
import lessonListsTuplesJson from '@pylearn/data/content/python-basics/lesson-009-lists-tuples.json';
import lessonDictsSetsJson from '@pylearn/data/content/python-basics/lesson-010-dicts-sets.json';
import lessonComprehensionsJson from '@pylearn/data/content/python-basics/lesson-011-comprehensions.json';
import lessonErrorHandlingJson from '@pylearn/data/content/python-basics/lesson-012-error-handling.json';
import lessonFileHandlingJson from '@pylearn/data/content/python-basics/lesson-013-file-handling.json';
import lessonModulesPackagesJson from '@pylearn/data/content/python-basics/lesson-014-modules-packages.json';
import lessonStdlibEssentialsJson from '@pylearn/data/content/python-basics/lesson-015-stdlib-essentials.json';
import moduleControlFlowJson from '@pylearn/data/content/python-basics/module-control-flow.json';
import moduleIntermediateJson from '@pylearn/data/content/python-basics/module-intermediate.json';
import moduleIntroJson from '@pylearn/data/content/python-basics/module-intro.json';
import trackJson from '@pylearn/data/content/python-basics/track.json';

export type AuthStatus = 'loading' | 'anonymous' | 'authenticated';

export interface AppState {
  readonly track?: Track;
  readonly session?: SessionState;
  readonly currentLesson?: Lesson;
  readonly currentCheckpoint?: Checkpoint;
  readonly summary?: SessionSummary;
  readonly attempts: Attempt[];
  readonly loading: boolean;
  readonly error?: string;
  readonly authStatus: AuthStatus;
  readonly user?: AuthUser;
}

export interface SubmitAttemptPayload {
  lessonId: string;
  checkpointId: string;
  isCorrect: boolean;
  revealsUsed?: number;
  lastHintLevel?: HintStage | null;
  selectedOptionId?: string;
  responseText?: string;
}

export interface AppActions {
  setActiveLesson: (_lessonId: string) => Promise<void>;
  setActiveCheckpoint: (_ref: CheckpointRef) => Promise<void>;
  submitAttempt: (_payload: SubmitAttemptPayload) => Promise<SubmissionFeedback | undefined>;
  resetModule: (_moduleId: string) => Promise<void>;
  signIn: () => void;
  signOut: () => Promise<void>;
}

export interface AppStore extends AppState, AppActions {}

interface InternalState {
  track?: Track;
  session?: SessionState;
  loading: boolean;
  error?: string;
  authStatus: AuthStatus;
  user?: AuthUser;
}

const AppStoreContext = createContext<AppStore | undefined>(undefined);

export function AppStoreProvider({ children }: { children: ReactNode }): ReactElement {
  const [internal, setInternal] = useState<InternalState>({
    loading: true,
    authStatus: 'loading',
  });

  const persistSession = useCallback((session: SessionState) => {
    void saveSessionState(session);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const track = buildDefaultTrack();
        const me = await getMe().catch(() => ({ authenticated: false as const }));

        if (me.authenticated) {
          const remote = await getRemoteSession(track.id);
          // An authenticated session is never persisted locally (see
          // setActiveLesson/setActiveCheckpoint below) — this only clears
          // anything left over from before that was true, e.g. a previous
          // anonymous visitor's progress on a shared machine, so it can't be
          // mistaken for this signed-in account's progress or leak back out
          // to the next anonymous visitor after sign-out.
          void clearSessionState(track.id);
          if (!cancelled) {
            setInternal({
              track,
              session: remote.session,
              loading: false,
              authStatus: 'authenticated',
              user: me.user,
            });
          }
          return;
        }

        // A URL of the form /?fresh=1 always wipes local anonymous progress
        // before loading — bookmark that URL and hard-refreshing it is a
        // repeatable "brand new visitor" test session. Never applies to a
        // signed-in account, so a stray query param can't nuke real progress.
        if (
          typeof window !== 'undefined' &&
          new URLSearchParams(window.location.search).get('fresh') === '1'
        ) {
          await clearSessionState(track.id);
          clearLocalOnboarding();
          window.history.replaceState(null, '', window.location.pathname);
        }

        const persisted = await loadSessionState(track.id);
        let session: SessionState;
        if (persisted) {
          // Correct a stale cursor left over from a since-fixed bug (or any
          // future one of the same shape) — see reconcileSessionCursor's
          // own doc comment. Never touches the attempts themselves.
          session = reconcileSessionCursor(track, persisted);
          if (session !== persisted) {
            persistSession(session);
          }
        } else {
          const startingLevel = loadLocalOnboarding()?.startingLevel;
          const startingLessonId = startingLevel
            ? recommendedStartingLessonId(startingLevel)
            : undefined;
          session = startSession(track, { startingLessonId });
          persistSession(session);
        }

        if (!cancelled) {
          setInternal({ track, session, loading: false, authStatus: 'anonymous' });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load track data';
        if (!cancelled) {
          setInternal({ loading: false, error: message, authStatus: 'anonymous' });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [persistSession]);

  const signIn = useCallback(() => {
    window.location.href = googleSignInUrl();
  }, []);

  const signOut = useCallback(async () => {
    await remoteLogout().catch(() => undefined);
    // Nothing about an authenticated session should be left in IndexedDB
    // (see the mount effect above), but clear it defensively here too —
    // this is the moment a shared machine most plausibly hands off to
    // whoever uses the browser next.
    if (internal.track) {
      await clearSessionState(internal.track.id);
    }
    window.location.reload();
  }, [internal.track]);

  const setActiveLesson = useCallback(async (lessonId: string) => {
    let nextSession: SessionState | undefined;
    let isAnonymous = false;
    setInternal((prev) => {
      if (!prev.track || !prev.session) return prev;
      const lesson = findLesson(prev.track, lessonId);
      if (!lesson) return prev;
      // Single source of truth for "where does this lesson resume" — see
      // packages/core/src/engine.ts. This used to be re-derived here with a
      // subtly different definition of "attempted" than the engine's own
      // selectNextCheckpoint, which caused a real regression (missing one
      // question, then reopening the lesson, reset the learner to
      // checkpoint 0). Routing through the shared function makes that class
      // of bug structurally impossible to reintroduce.
      const nextCheckpoint = firstUnattemptedCheckpointInLesson(prev.track, prev.session, lessonId);
      const fallbackCheckpoint = lesson.checkpoints[0]?.id;
      nextSession = {
        ...prev.session,
        currentLessonId: lessonId,
        currentCheckpointId: nextCheckpoint?.checkpointId ?? fallbackCheckpoint,
      };
      isAnonymous = prev.authStatus !== 'authenticated';
      return {
        ...prev,
        session: nextSession,
      };
    });

    // An authenticated session's cursor lives on the server (submitAttempt
    // pushes it there on every answer); persisting it to this browser's
    // IndexedDB too would leak it to the next anonymous visitor on a shared
    // machine, and there's nothing here to read it back from anyway.
    if (nextSession && isAnonymous) {
      await saveSessionState(nextSession);
    }
  }, []);

  // Trusts a checkpoint ref the engine already computed (e.g. the `next`
  // returned from submitAnswer) instead of re-deriving it — used to advance
  // after a correct answer, where re-running a "find the next checkpoint"
  // lookup a second time is exactly the duplicate-logic risk described above.
  const setActiveCheckpoint = useCallback(async (ref: CheckpointRef) => {
    let nextSession: SessionState | undefined;
    let isAnonymous = false;
    setInternal((prev) => {
      if (!prev.session) return prev;
      nextSession = {
        ...prev.session,
        currentLessonId: ref.lessonId,
        currentCheckpointId: ref.checkpointId,
      };
      isAnonymous = prev.authStatus !== 'authenticated';
      return {
        ...prev,
        session: nextSession,
      };
    });

    if (nextSession && isAnonymous) {
      await saveSessionState(nextSession);
    }
  }, []);

  const submitAttempt = useCallback(
    async (payload: SubmitAttemptPayload): Promise<SubmissionFeedback | undefined> => {
      if (internal.authStatus === 'authenticated' && internal.track) {
        const response = await submitAttemptRemote({
          trackId: internal.track.id,
          lessonId: payload.lessonId,
          checkpointId: payload.checkpointId,
          selectedOptionId: payload.selectedOptionId,
          responseText: payload.responseText,
          revealsUsed: payload.revealsUsed,
          lastHintLevel: payload.lastHintLevel ?? undefined,
        });
        const preservedSession = pinCursorToSubmittedCheckpoint(response.session, payload);
        setInternal((prev) => ({ ...prev, session: preservedSession }));
        return response.feedback;
      }

      let outcome: SubmissionOutcome | undefined;
      setInternal((prev) => {
        if (!prev.track || !prev.session) return prev;
        const attempt: Attempt = {
          checkpointId: payload.checkpointId,
          lessonId: payload.lessonId,
          selectedOptionId: payload.selectedOptionId,
          responseText: payload.responseText,
          isCorrect: payload.isCorrect,
          revealsUsed: payload.revealsUsed ?? 0,
          lastHintLevel: payload.lastHintLevel ?? undefined,
          timestamp: Date.now(),
        };

        outcome = submitAnswer(prev.track, prev.session, attempt);
        if (!outcome) return prev;

        const preservedSession = pinCursorToSubmittedCheckpoint(outcome.session, payload);
        outcome.session = preservedSession;

        return {
          ...prev,
          session: preservedSession,
        };
      });

      if (outcome) {
        persistSession(outcome.session);
        return outcome.feedback;
      }

      return undefined;
    },
    [persistSession, internal.authStatus, internal.track],
  );

  const resetModule = useCallback(
    async (moduleId: string): Promise<void> => {
      if (internal.authStatus === 'authenticated' && internal.track) {
        const response = await resetModuleRemote(internal.track.id, moduleId);
        setInternal((prev) => ({ ...prev, session: response.session }));
        return;
      }

      let nextSession: SessionState | undefined;
      setInternal((prev) => {
        if (!prev.track || !prev.session) return prev;
        nextSession = resetModuleProgress(prev.track, prev.session, moduleId);
        return { ...prev, session: nextSession };
      });

      if (nextSession) {
        await saveSessionState(nextSession);
      }
    },
    [internal.authStatus, internal.track],
  );

  const track = internal.track;
  const session = internal.session;
  const attempts = session?.attempts ?? [];
  const currentLesson =
    track && session?.currentLessonId ? findLesson(track, session.currentLessonId) : undefined;
  const currentCheckpoint =
    currentLesson && session?.currentCheckpointId
      ? currentLesson.checkpoints.find(
          (checkpoint) => checkpoint.id === session.currentCheckpointId,
        )
      : undefined;
  const summary = track && session ? getSummary(track, session) : undefined;

  const value = useMemo<AppStore>(
    () => ({
      track,
      session,
      currentLesson,
      currentCheckpoint,
      summary,
      attempts,
      loading: internal.loading,
      error: internal.error,
      authStatus: internal.authStatus,
      user: internal.user,
      setActiveLesson,
      setActiveCheckpoint,
      submitAttempt,
      resetModule,
      signIn,
      signOut,
    }),
    [
      attempts,
      currentCheckpoint,
      currentLesson,
      internal.error,
      internal.loading,
      internal.authStatus,
      internal.user,
      session,
      setActiveLesson,
      setActiveCheckpoint,
      submitAttempt,
      resetModule,
      signIn,
      signOut,
      summary,
      track,
    ],
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore(): AppStore {
  const context = useContext(AppStoreContext);
  if (!context) {
    throw new Error('useAppStore must be used within AppStoreProvider');
  }
  return context;
}

interface RawModuleRef {
  path: string;
}
interface RawModule {
  id: string;
  trackId: string;
  title: string;
  summary: string;
  description?: string;
  difficulty?: Track['modules'][number]['difficulty'];
  tags?: string[];
  prerequisites?: string[];
  lessons: RawModuleRef[];
}

const LESSON_JSON_BY_PATH = new Map<string, Lesson>([
  ['./lesson-000-getting-started.json', lessonGettingStartedJson as Lesson],
  ['./lesson-001-variables.json', lessonVariablesJson as Lesson],
  ['./lesson-002-types.json', lessonTypesJson as Lesson],
  ['./lesson-003-operators.json', lessonOperatorsJson as Lesson],
  ['./lesson-004-strings.json', lessonStringsJson as Lesson],
  ['./lesson-005-io.json', lessonIoJson as Lesson],
  ['./lesson-006-conditionals.json', lessonConditionalsJson as Lesson],
  ['./lesson-007-loops.json', lessonLoopsJson as Lesson],
  ['./lesson-008-functions.json', lessonFunctionsJson as Lesson],
  ['./lesson-009-lists-tuples.json', lessonListsTuplesJson as Lesson],
  ['./lesson-010-dicts-sets.json', lessonDictsSetsJson as Lesson],
  ['./lesson-011-comprehensions.json', lessonComprehensionsJson as Lesson],
  ['./lesson-012-error-handling.json', lessonErrorHandlingJson as Lesson],
  ['./lesson-013-file-handling.json', lessonFileHandlingJson as Lesson],
  ['./lesson-014-modules-packages.json', lessonModulesPackagesJson as Lesson],
  ['./lesson-015-stdlib-essentials.json', lessonStdlibEssentialsJson as Lesson],
]);

const MODULE_JSON_BY_PATH = new Map<string, RawModule>([
  ['./module-intro.json', moduleIntroJson as RawModule],
  ['./module-control-flow.json', moduleControlFlowJson as RawModule],
  ['./module-intermediate.json', moduleIntermediateJson as RawModule],
]);

function buildDefaultTrack(): Track {
  type ModuleReference = { path: string };
  const moduleRefs = trackJson.modules as ModuleReference[];

  const modules = moduleRefs.map((moduleRef): Track['modules'][number] => {
    const moduleJson = MODULE_JSON_BY_PATH.get(moduleRef.path);
    if (!moduleJson) {
      throw new Error(`Missing module content for path ${moduleRef.path}`);
    }

    const lessons = moduleJson.lessons.map((lessonRef) => {
      const lesson = LESSON_JSON_BY_PATH.get(lessonRef.path);
      if (!lesson) {
        throw new Error(`Missing lesson content for path ${lessonRef.path}`);
      }
      return lesson;
    });

    return {
      id: moduleJson.id,
      trackId: moduleJson.trackId,
      title: moduleJson.title,
      summary: moduleJson.summary,
      description: moduleJson.description,
      difficulty: moduleJson.difficulty,
      tags: moduleJson.tags,
      prerequisites: moduleJson.prerequisites,
      lessons,
    };
  });

  return {
    id: trackJson.id,
    title: trackJson.title,
    summary: trackJson.summary,
    description: trackJson.description,
    modules,
  };
}

// The engine (run locally or on the server, via submitAnswer) already
// advances the cursor forward on a correct answer — that's exactly right
// for the *next* explicit "Next checkpoint" click, but the UI needs to keep
// rendering the checkpoint just answered until then, or Lesson.tsx's
// reset-on-checkpoint-change effect wipes the feedback before the learner
// ever sees it. This used to only be applied on the anonymous branch of
// submitAttempt; the authenticated branch adopted the server's
// already-advanced cursor as-is, so a signed-in learner's correct answers
// never displayed and, on a lesson's last checkpoint, silently bounced them
// to an undefined-lesson state. Shared here so both branches can't drift
// apart on this again.
function pinCursorToSubmittedCheckpoint(
  session: SessionState,
  payload: SubmitAttemptPayload,
): SessionState {
  return {
    ...session,
    currentLessonId: payload.lessonId,
    currentCheckpointId: payload.checkpointId,
  };
}

function findLesson(track: Track, lessonId: string): Lesson | undefined {
  for (const module of track.modules) {
    const lesson = module.lessons.find((candidate: Lesson) => candidate.id === lessonId);
    if (lesson) return lesson;
  }
  return undefined;
}
