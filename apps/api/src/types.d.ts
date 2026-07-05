import type { AuthUser } from './auth/session';

declare module 'fastify' {
  // eslint-disable-next-line no-unused-vars -- module augmentation, not a local binding
  interface FastifyRequest {
    user?: AuthUser;
  }
}
