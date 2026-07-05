import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';

import { requireAuth } from '../auth/middleware';
import { db, schema } from '../db/client';
import { placeSessionAtStartingLevel } from '../learningSessions';

import { getPythonBasicsTrack } from './tracks.routes';

interface OnboardingBody {
  startingLevel: string;
  learningGoal: string;
}

export function registerProfileRoutes(app: FastifyInstance): void {
  app.put<{ Body: OnboardingBody }>(
    '/api/profile/onboarding',
    { preHandler: requireAuth },
    async (request) => {
      await db
        .update(schema.users)
        .set({
          startingLevel: request.body.startingLevel,
          learningGoal: request.body.learningGoal,
        })
        .where(eq(schema.users.id, request.user!.id));

      const track = await getPythonBasicsTrack();
      await placeSessionAtStartingLevel(request.user!.id, track, request.body.startingLevel);

      return { ok: true };
    },
  );
}
