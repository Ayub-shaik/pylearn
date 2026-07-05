import type { FastifyInstance } from 'fastify';

import { requireAuth } from '../auth/middleware';
import { getOrCreateSession } from '../learningSessions';

import { getPythonBasicsTrack } from './tracks.routes';

import { getSummary } from '@pylearn/core';

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
}
