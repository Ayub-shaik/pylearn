import { eq } from 'drizzle-orm';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { db, schema } from '../db/client';

const COOKIE_NAME = 'pylearn_session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  startingLevel: string | null;
  learningGoal: string | null;
}

export async function createSession(reply: FastifyReply, userId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const [session] = await db
    .insert(schema.authSessions)
    .values({ userId, expiresAt })
    .returning({ id: schema.authSessions.id });

  reply.setCookie(COOKIE_NAME, session.id, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    signed: true,
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function destroySession(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const raw = request.cookies[COOKIE_NAME];
  if (raw) {
    const unsigned = request.unsignCookie(raw);
    if (unsigned.valid && unsigned.value) {
      await db.delete(schema.authSessions).where(eq(schema.authSessions.id, unsigned.value));
    }
  }
  reply.clearCookie(COOKIE_NAME, { path: '/' });
}

export async function getUserFromRequest(request: FastifyRequest): Promise<AuthUser | undefined> {
  const raw = request.cookies[COOKIE_NAME];
  if (!raw) return undefined;

  const unsigned = request.unsignCookie(raw);
  if (!unsigned.valid || !unsigned.value) return undefined;

  const rows = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      displayName: schema.users.displayName,
      avatarUrl: schema.users.avatarUrl,
      startingLevel: schema.users.startingLevel,
      learningGoal: schema.users.learningGoal,
      expiresAt: schema.authSessions.expiresAt,
    })
    .from(schema.authSessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.authSessions.userId))
    .where(eq(schema.authSessions.id, unsigned.value))
    .limit(1);

  const row = rows[0];
  if (!row || row.expiresAt.getTime() < Date.now()) return undefined;

  return {
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl,
    startingLevel: row.startingLevel,
    learningGoal: row.learningGoal,
  };
}
