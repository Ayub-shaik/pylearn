import { and, eq, inArray } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';

import { requireAuth } from '../auth/middleware';
import { db, schema } from '../db/client';
import { getOrCreateSession, persistSessionCursorAndMastery } from '../learningSessions';

import { getPythonBasicsTrack } from './tracks.routes';

import { getSummary, resetModuleProgress } from '@pylearn/core';

export function registerSessionRoutes(app: FastifyInstance): void {
  app.get<{ Params: { trackId: string } }>(
    '/api/sessions/:trackId',
    { preHandler: requireAuth },
    async (request, reply) => {
      const track = await getPythonBasicsTrack();
      if (track.id !== request.params.trackId) {
        reply.code(404).send({ error: 'Track not found' });
        return;
      }
      const session = await getOrCreateSession(
        request.user!.id,
        track,
        request.user!.startingLevel,
      );
      const summary = getSummary(track, session);
      return { session, summary };
    },
  );

  app.post<{ Params: { trackId: string; moduleId: string } }>(
    '/api/sessions/:trackId/modules/:moduleId/reset',
    { preHandler: requireAuth },
    async (request, reply) => {
      const track = await getPythonBasicsTrack();
      if (track.id !== request.params.trackId) {
        reply.code(404).send({ error: 'Track not found' });
        return;
      }
      const module = track.modules.find((candidate) => candidate.id === request.params.moduleId);
      if (!module) {
        reply.code(404).send({ error: 'Module not found' });
        return;
      }

      const session = await getOrCreateSession(
        request.user!.id,
        track,
        request.user!.startingLevel,
      );
      const nextSession = resetModuleProgress(track, session, module.id);

      const lessonIds = module.lessons.map((lesson) => lesson.id);
      await db
        .delete(schema.attempts)
        .where(
          and(
            eq(schema.attempts.sessionId, session.id),
            inArray(schema.attempts.lessonId, lessonIds),
          ),
        );
      await persistSessionCursorAndMastery(nextSession);

      const summary = getSummary(track, nextSession);
      return { session: nextSession, summary };
    },
  );
}
