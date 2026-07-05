import type { FastifyInstance } from 'fastify';

import { requireAuth } from '../auth/middleware';
import {
  getOrCreateSession,
  persistSessionCursorAndMastery,
  recordAttempt,
} from '../learningSessions';

import { getPythonBasicsTrack } from './tracks.routes';

import { submitAnswer, type Attempt } from '@pylearn/core';

interface SubmitAttemptBody {
  trackId: string;
  lessonId: string;
  checkpointId: string;
  selectedOptionId?: string;
  responseText?: string;
  revealsUsed?: number;
  lastHintLevel?: Attempt['lastHintLevel'];
}

export function registerAttemptRoutes(app: FastifyInstance): void {
  app.post<{ Body: SubmitAttemptBody }>(
    '/api/attempts',
    { preHandler: requireAuth },
    async (request, reply) => {
      const body = request.body;
      const track = await getPythonBasicsTrack();
      if (track.id !== body.trackId) {
        reply.code(404).send({ error: 'Track not found' });
        return;
      }

      const session = await getOrCreateSession(request.user!.id, track);
      const attempt: Attempt = {
        lessonId: body.lessonId,
        checkpointId: body.checkpointId,
        selectedOptionId: body.selectedOptionId,
        responseText: body.responseText,
        timestamp: Date.now(),
        isCorrect: false,
        revealsUsed: body.revealsUsed ?? 0,
        lastHintLevel: body.lastHintLevel,
      };

      const outcome = submitAnswer(track, session, attempt);
      const recorded = outcome.session.attempts[outcome.session.attempts.length - 1];

      await recordAttempt(session.id, recorded);
      await persistSessionCursorAndMastery(outcome.session);

      return { feedback: outcome.feedback, mastery: outcome.session.mastery };
    },
  );
}
