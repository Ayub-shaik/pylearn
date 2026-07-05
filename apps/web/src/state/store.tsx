import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';

import {
  type AuthUser,
  getMe,
  googleSignInUrl,
  getSession as getRemoteSession,
  logout as remoteLogout,
  submitAttemptRemote,
} from '../lib/api';
import { loadSessionState, saveSessionState } from '../lib/db';

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
  getSummary,
  selectNextCheckpoint,
  startSession,
  submitAnswer,
} from '@pylearn/core';
import lessonVariablesJson from '@pylearn/data/content/python-basics/lesson-001-variables.json';
import lessonTypesJson from '@pylearn/data/content/python-basics/lesson-002-types.json';
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
  setActiveLesson: (_lessonId: string) => void;
  submitAttempt: (_payload: SubmitAttemptPayload) => Promise<SubmissionFeedback | undefined>;
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

        const persisted = await loadSessionState(track.id);
        let session: SessionState;
        if (persisted) {
          session = persisted;
        } else {
          const baseSession = startSession(track);
          const initialRef = selectNextCheckpoint(track, baseSession);
          session = {
            ...baseSession,
            currentLessonId: initialRef?.lessonId,
            currentCheckpointId: initialRef?.checkpointId,
          };
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
    window.location.reload();
  }, []);

  const setActiveLesson = useCallback(
    (lessonId: string) => {
      let nextSession: SessionState | undefined;
      setInternal((prev) => {
        if (!prev.track || !prev.session) return prev;
        const lesson = findLesson(prev.track, lessonId);
        if (!lesson) return prev;
        const nextCheckpoint = findFirstUnattemptedInLesson(prev.track, prev.session, lessonId);
        const fallbackCheckpoint = lesson.checkpoints[0]?.id;
        nextSession = {
          ...prev.session,
          currentLessonId: lessonId,
          currentCheckpointId: nextCheckpoint?.checkpointId ?? fallbackCheckpoint,
        };
        return {
          ...prev,
          session: nextSession,
        };
      });

      if (nextSession) {
        persistSession(nextSession);
      }
    },
    [persistSession],
  );

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
        setInternal((prev) => ({ ...prev, session: response.session }));
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

        const preservedSession: SessionState = {
          ...outcome.session,
          currentLessonId: payload.lessonId,
          currentCheckpointId: payload.checkpointId,
        };

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
      submitAttempt,
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
      submitAttempt,
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

function buildDefaultTrack(): Track {
  const lessonMap = new Map<string, Lesson>([
    ['./lesson-001-variables.json', lessonVariablesJson as Lesson],
    ['./lesson-002-types.json', lessonTypesJson as Lesson],
  ]);

  type LessonReference = { path: string };
  const lessonRefs = moduleIntroJson.lessons as LessonReference[];
  const moduleLessons = lessonRefs.map((entry: LessonReference) => {
    const lesson = lessonMap.get(entry.path);
    if (!lesson) {
      throw new Error(`Missing lesson content for path ${entry.path}`);
    }
    return lesson;
  });

  const moduleIntro = {
    id: moduleIntroJson.id,
    trackId: moduleIntroJson.trackId,
    title: moduleIntroJson.title,
    summary: moduleIntroJson.summary,
    description: moduleIntroJson.description,
    lessons: moduleLessons,
  } satisfies Track['modules'][number];

  return {
    id: trackJson.id,
    title: trackJson.title,
    summary: trackJson.summary,
    description: trackJson.description,
    modules: [moduleIntro],
  };
}

function findLesson(track: Track, lessonId: string): Lesson | undefined {
  for (const module of track.modules) {
    const lesson = module.lessons.find((candidate: Lesson) => candidate.id === lessonId);
    if (lesson) return lesson;
  }
  return undefined;
}

function findFirstUnattemptedInLesson(
  track: Track,
  session: SessionState,
  lessonId: string,
): CheckpointRef | undefined {
  const lesson = findLesson(track, lessonId);
  if (!lesson) return undefined;
  const attemptedIds = new Set(session.attempts.map((attempt: Attempt) => attempt.checkpointId));
  const checkpoint = lesson.checkpoints.find(
    (candidate: Checkpoint) => !attemptedIds.has(candidate.id),
  );
  return checkpoint ? ({ lessonId, checkpointId: checkpoint.id } as CheckpointRef) : undefined;
}
