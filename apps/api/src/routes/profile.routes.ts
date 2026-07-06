import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';

import { requireAuth } from '../auth/middleware';
import { db, schema } from '../db/client';
import { placeSessionAtStartingLevel } from '../learningSessions';

import { getPythonBasicsTrack } from './tracks.routes';

import { isStartingLevel } from '@pylearn/core';

interface OnboardingBody {
  startingLevel: string;
  learningGoal: string;
}

const VALID_LEARNING_GOALS = new Set(['general', 'devops', 'network']);

export function registerProfileRoutes(app: FastifyInstance): void {
  app.put<{ Body: OnboardingBody }>(
    '/api/profile/onboarding',
    { preHandler: requireAuth },
    async (request, reply) => {
      const { startingLevel, learningGoal } = request.body ?? {};
      if (!isStartingLevel(startingLevel) || !VALID_LEARNING_GOALS.has(learningGoal)) {
        reply.code(400).send({ error: 'Invalid startingLevel or learningGoal' });
        return;
      }

      await db
        .update(schema.users)
        .set({ startingLevel, learningGoal })
        .where(eq(schema.users.id, request.user!.id));

      const track = await getPythonBasicsTrack();
      await placeSessionAtStartingLevel(request.user!.id, track, startingLevel);

      return { ok: true };
    },
  );

  // Wipes this user's progress for every track entirely (attempts cascade-delete with the
  // session row) and clears onboarding answers, so they can genuinely start over — placement
  // only repositions an existing session when it has zero attempts, so without this a returning
  // user re-running onboarding just lands back where they already were.
  app.post('/api/profile/reset', { preHandler: requireAuth }, async (request) => {
    await db
      .delete(schema.learningSessions)
      .where(eq(schema.learningSessions.userId, request.user!.id));
    await db
      .update(schema.users)
      .set({ startingLevel: null, learningGoal: null })
      .where(eq(schema.users.id, request.user!.id));

    return { ok: true };
  });
}
