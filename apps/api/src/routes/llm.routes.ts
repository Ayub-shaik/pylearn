import type { FastifyInstance } from 'fastify';

import { requireAuth } from '../auth/middleware';
import { generate } from '../llm/policy';
import { buildHintPrompt } from '../llm/prompts/hint';

import { getPythonBasicsTrack } from './tracks.routes';

import { resolveCheckpoint, type HintLevel } from '@pylearn/core';

interface HintRequestBody {
  trackId: string;
  lessonId: string;
  checkpointId: string;
  level: HintLevel;
}

export function registerLlmRoutes(app: FastifyInstance): void {
  app.post<{ Body: HintRequestBody }>(
    '/api/llm/hint',
    { preHandler: requireAuth },
    async (request, reply) => {
      const track = await getPythonBasicsTrack();
      if (track.id !== request.body.trackId) {
        reply.code(404).send({ error: 'Track not found' });
        return;
      }

      const checkpoint = resolveCheckpoint(track, {
        lessonId: request.body.lessonId,
        checkpointId: request.body.checkpointId,
      });
      if (!checkpoint) {
        reply.code(404).send({ error: 'Checkpoint not found' });
        return;
      }

      const { prompt, groundingTerms, authoredFallback } = buildHintPrompt(
        checkpoint,
        request.body.level,
      );

      const result = await generate({
        checkpointId: checkpoint.id,
        task: `hint:${request.body.level}`,
        prompt,
        groundingTerms,
        fallback: authoredFallback || 'Take another look at the lesson content above for a clue.',
      });

      return result;
    },
  );
}
