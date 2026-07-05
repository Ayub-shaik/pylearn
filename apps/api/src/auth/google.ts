import crypto from 'node:crypto';

import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';

import { config } from '../config';
import { db, schema } from '../db/client';

import { createSession, destroySession, getUserFromRequest } from './session';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';
const STATE_COOKIE = 'pylearn_oauth_state';

interface GoogleTokenResponse {
  access_token: string;
}

interface GoogleProfile {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}

export function registerAuthRoutes(app: FastifyInstance): void {
  app.get('/api/auth/config', async () => ({ googleEnabled: config.googleConfigured }));

  app.get('/api/auth/google/start', async (request, reply) => {
    if (!config.googleConfigured) {
      reply.code(503).send({ error: 'Google sign-in is not configured yet.' });
      return;
    }

    const state = crypto.randomBytes(16).toString('hex');
    reply.setCookie(STATE_COOKIE, state, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 600,
    });

    const params = new URLSearchParams({
      client_id: config.google.clientId,
      redirect_uri: config.google.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      access_type: 'online',
      prompt: 'select_account',
    });

    reply.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
  });

  app.get<{ Querystring: { code?: string; state?: string; error?: string } }>(
    '/api/auth/google/callback',
    async (request, reply) => {
      const { code, state, error } = request.query;
      const expectedState = request.cookies[STATE_COOKIE];
      reply.clearCookie(STATE_COOKIE, { path: '/' });

      if (error || !code || !state || !expectedState || state !== expectedState) {
        reply.code(400).send({ error: 'Google sign-in failed or was cancelled.' });
        return;
      }

      const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: config.google.clientId,
          client_secret: config.google.clientSecret,
          redirect_uri: config.google.redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenResponse.ok) {
        reply.code(502).send({ error: 'Failed to exchange Google auth code.' });
        return;
      }

      const tokens = (await tokenResponse.json()) as GoogleTokenResponse;

      const profileResponse = await fetch(GOOGLE_USERINFO_URL, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      if (!profileResponse.ok) {
        reply.code(502).send({ error: 'Failed to fetch Google profile.' });
        return;
      }

      const profile = (await profileResponse.json()) as GoogleProfile;
      const userId = await upsertUser(profile);

      await createSession(reply, userId);
      reply.redirect(config.publicOrigin);
    },
  );

  app.get('/api/auth/me', async (request, reply) => {
    const user = await getUserFromRequest(request);
    if (!user) {
      reply.send({ authenticated: false });
      return;
    }
    reply.send({ authenticated: true, user });
  });

  app.post('/api/auth/logout', async (request, reply) => {
    await destroySession(request, reply);
    reply.send({ ok: true });
  });
}

async function upsertUser(profile: GoogleProfile): Promise<string> {
  const existing = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.googleSub, profile.sub))
    .limit(1);

  if (existing[0]) {
    await db
      .update(schema.users)
      .set({
        lastLoginAt: new Date(),
        displayName: profile.name ?? null,
        avatarUrl: profile.picture ?? null,
      })
      .where(eq(schema.users.id, existing[0].id));
    return existing[0].id;
  }

  const [created] = await db
    .insert(schema.users)
    .values({
      googleSub: profile.sub,
      email: profile.email,
      displayName: profile.name ?? null,
      avatarUrl: profile.picture ?? null,
      lastLoginAt: new Date(),
    })
    .returning({ id: schema.users.id });

  return created.id;
}
