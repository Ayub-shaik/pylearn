import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';

import { config } from '../config';
import { db, schema } from '../db/client';

import { createSession } from './session';

const GUEST_GOOGLE_SUB = 'dev-guest';
const GUEST_EMAIL = 'guest@pylearn.local';

interface GuestLoginBody {
  username?: string;
  password?: string;
}

/**
 * Dev/debug-only login for exercising the authenticated code path without a
 * real Google account. Entirely absent (404) unless DEV_GUEST_LOGIN_ENABLED
 * is set — must be off before any real public rollout.
 */
export function registerGuestAuthRoutes(app: FastifyInstance): void {
  if (!config.devGuestLogin.enabled) {
    return;
  }

  app.post<{ Body: GuestLoginBody }>(
    '/api/auth/guest',
    { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const { username, password } = request.body ?? {};
      if (
        !config.devGuestLogin.username ||
        username !== config.devGuestLogin.username ||
        password !== config.devGuestLogin.password
      ) {
        reply.code(401).send({ error: 'Invalid guest credentials' });
        return;
      }

      const userId = await upsertGuestUser();
      await createSession(reply, userId);
      reply.send({ ok: true });
    },
  );
}

async function upsertGuestUser(): Promise<string> {
  const existing = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.googleSub, GUEST_GOOGLE_SUB))
    .limit(1);

  if (existing[0]) {
    await db
      .update(schema.users)
      .set({ lastLoginAt: new Date() })
      .where(eq(schema.users.id, existing[0].id));
    return existing[0].id;
  }

  const [created] = await db
    .insert(schema.users)
    .values({
      googleSub: GUEST_GOOGLE_SUB,
      email: GUEST_EMAIL,
      displayName: 'Guest (dev)',
      lastLoginAt: new Date(),
    })
    .returning({ id: schema.users.id });

  return created.id;
}
