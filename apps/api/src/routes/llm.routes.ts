import type { FastifyInstance } from 'fastify';

import { requireAuth } from '../auth/middleware';
import { generate } from '../llm/policy';
import { buildChatPrompt } from '../llm/prompts/chat';
import { buildHintPrompt } from '../llm/prompts/hint';

import { getPythonBasicsTrack } from './tracks.routes';

import { resolveCheckpoint, type HintLevel } from '@pylearn/core';

interface HintRequestBody {
  trackId: string;
  lessonId: string;
  checkpointId: string;
  level: HintLevel;
}

interface ChatRequestBody {
  trackId: string;
  lessonId: string;
  checkpointId: string;
  message: string;
}

const MAX_CHAT_MESSAGE_LENGTH = 500;

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

  app.post<{ Body: ChatRequestBody }>(
    '/api/llm/chat',
    { preHandler: requireAuth },
    async (request, reply) => {
      const message = request.body.message?.trim();
      if (!message) {
        reply.code(400).send({ error: 'message is required' });
        return;
      }
      if (message.length > MAX_CHAT_MESSAGE_LENGTH) {
        reply
          .code(400)
          .send({ error: `message must be under ${MAX_CHAT_MESSAGE_LENGTH} characters` });
        return;
      }

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

      const { prompt, groundingTerms, templateFallback } = buildChatPrompt(checkpoint, message);

      const result = await generate({
        checkpointId: checkpoint.id,
        task: 'chat',
        prompt,
        groundingTerms,
        fallback: templateFallback,
        cacheable: false,
      });

      return result;
    },
  );
}
