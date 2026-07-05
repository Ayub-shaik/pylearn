import type { FastifyReply, FastifyRequest } from 'fastify';

import { getUserFromRequest } from './session';

export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const user = await getUserFromRequest(request);
  if (!user) {
    reply.code(401).send({ error: 'Not authenticated' });
    return;
  }
  request.user = user;
}
