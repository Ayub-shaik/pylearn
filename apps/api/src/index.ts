import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import Fastify from 'fastify';

import { registerAuthRoutes } from './auth/google';
import { registerGuestAuthRoutes } from './auth/guest';
import { config } from './config';
import { registerAttemptRoutes } from './routes/attempts.routes';
import { registerLlmRoutes } from './routes/llm.routes';
import { registerProfileRoutes } from './routes/profile.routes';
import { registerSessionRoutes } from './routes/sessions.routes';
import { registerTrackRoutes } from './routes/tracks.routes';

const app = Fastify({ logger: true });

await app.register(cookie, { secret: config.sessionSecret });
// Global default; individual routes (auth, llm) set stricter limits below.
await app.register(rateLimit, { max: 120, timeWindow: '1 minute' });

app.get('/api/health', async () => ({ status: 'ok' }));

registerAuthRoutes(app);
registerGuestAuthRoutes(app);
registerTrackRoutes(app);
registerSessionRoutes(app);
registerAttemptRoutes(app);
registerLlmRoutes(app);
registerProfileRoutes(app);

app.listen({ port: config.port, host: '0.0.0.0' }).catch((error) => {
  app.log.error(error);
  process.exit(1);
});

// No Ollama warm-up call here: NVIDIA NIM is the primary generation tier
// (see llm/policy.ts) — we deliberately don't keep the local model loaded
// on this shared host unless a request actually falls back to it.
