import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';

import { requireAuth } from '../auth/middleware';
import { db, schema } from '../db/client';

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

      return { ok: true };
    },
  );
}
