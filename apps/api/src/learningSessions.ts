import { and, asc, eq } from 'drizzle-orm';

import { db, schema } from './db/client';

import type { Attempt, Mastery, SessionState, StartingLevel, Track } from '@pylearn/core';
import {
  firstCheckpointOfLesson,
  isStartingLevel,
  recommendedStartingLessonId,
  startSession,
} from '@pylearn/core';

export async function getOrCreateSession(
  userId: string,
  track: Track,
  startingLevel?: StartingLevel | string | null,
): Promise<SessionState> {
  const existing = await loadSessionState(userId, track.id);
  if (existing) return existing;

  const startingLessonId = isStartingLevel(startingLevel)
    ? recommendedStartingLessonId(startingLevel)
    : undefined;
  const fresh = startSession(track, { startingLessonId });
  await db.insert(schema.learningSessions).values({
    id: fresh.id,
    userId,
    trackId: track.id,
    startedAt: new Date(fresh.startedAt),
    currentLessonId: fresh.currentLessonId,
    currentCheckpointId: fresh.currentCheckpointId,
    masteryOverallPct: String(fresh.mastery.overallPercent),
    masteryLessonPct: fresh.mastery.lessonPercent,
    masteryUpdatedAt: new Date(fresh.mastery.updatedAt),
  });
  return fresh;
}

/**
 * Apply onboarding placement to a user's session for this track: creates a
 * freshly-placed session if none exists yet, or repositions the cursor of
 * an existing one IF it has no recorded attempts yet (so this never clobbers
 * real progress — it only fixes the common case where a session was already
 * auto-created, with no placement, by an earlier page visit before the user
 * finished onboarding).
 */
export async function placeSessionAtStartingLevel(
  userId: string,
  track: Track,
  startingLevel: StartingLevel | string | null | undefined,
): Promise<void> {
  if (!isStartingLevel(startingLevel)) return;

  const startingLessonId = recommendedStartingLessonId(startingLevel);
  const existing = await loadSessionState(userId, track.id);

  if (!existing) {
    await getOrCreateSession(userId, track, startingLevel);
    return;
  }

  if (existing.attempts.length > 0) return;

  const targetRef = firstCheckpointOfLesson(track, startingLessonId);
  if (!targetRef) return;

  await persistSessionCursorAndMastery({
    ...existing,
    currentLessonId: targetRef.lessonId,
    currentCheckpointId: targetRef.checkpointId,
  });
}

export async function loadSessionState(
  userId: string,
  trackId: string,
): Promise<SessionState | undefined> {
  const rows = await db
    .select()
    .from(schema.learningSessions)
    .where(
      and(eq(schema.learningSessions.userId, userId), eq(schema.learningSessions.trackId, trackId)),
    )
    .limit(1);

  const row = rows[0];
  if (!row) return undefined;

  const attemptRows = await db
    .select()
    .from(schema.attempts)
    .where(eq(schema.attempts.sessionId, row.id))
    .orderBy(asc(schema.attempts.submittedAt));

  const attempts: Attempt[] = attemptRows.map((attempt) => ({
    checkpointId: attempt.checkpointId,
    lessonId: attempt.lessonId,
    selectedOptionId: attempt.selectedOptionId ?? undefined,
    responseText: attempt.responseText ?? undefined,
    timestamp: attempt.submittedAt.getTime(),
    isCorrect: attempt.isCorrect,
    revealsUsed: attempt.revealsUsed,
    lastHintLevel: (attempt.lastHintLevel as Attempt['lastHintLevel']) ?? undefined,
    score: attempt.score !== null ? Number(attempt.score) : undefined,
  }));

  const mastery: Mastery = {
    overallPercent: Number(row.masteryOverallPct),
    lessonPercent: (row.masteryLessonPct as Record<string, number>) ?? {},
    updatedAt: row.masteryUpdatedAt ? row.masteryUpdatedAt.getTime() : Date.now(),
  };

  return {
    id: row.id,
    trackId: row.trackId,
    attempts,
    mastery,
    startedAt: row.startedAt.getTime(),
    currentLessonId: row.currentLessonId ?? undefined,
    currentCheckpointId: row.currentCheckpointId ?? undefined,
    completedAt: row.completedAt ? row.completedAt.getTime() : undefined,
  };
}

export async function persistSessionCursorAndMastery(session: SessionState): Promise<void> {
  await db
    .update(schema.learningSessions)
    .set({
      currentLessonId: session.currentLessonId,
      currentCheckpointId: session.currentCheckpointId,
      completedAt: session.completedAt ? new Date(session.completedAt) : null,
      masteryOverallPct: String(session.mastery.overallPercent),
      masteryLessonPct: session.mastery.lessonPercent,
      masteryUpdatedAt: new Date(session.mastery.updatedAt),
    })
    .where(eq(schema.learningSessions.id, session.id));
}

export async function recordAttempt(sessionId: string, attempt: Attempt): Promise<void> {
  await db.insert(schema.attempts).values({
    sessionId,
    checkpointId: attempt.checkpointId,
    lessonId: attempt.lessonId,
    selectedOptionId: attempt.selectedOptionId,
    responseText: attempt.responseText,
    isCorrect: attempt.isCorrect,
    revealsUsed: attempt.revealsUsed,
    lastHintLevel: attempt.lastHintLevel,
    score: attempt.score !== undefined ? String(attempt.score) : undefined,
    submittedAt: new Date(attempt.timestamp),
  });
}
