import cookie from '@fastify/cookie';
import Fastify from 'fastify';

import { registerAuthRoutes } from './auth/google';
import { registerGuestAuthRoutes } from './auth/guest';
import { config } from './config';
import { generateWithOllama } from './llm/client';
import { registerAttemptRoutes } from './routes/attempts.routes';
import { registerLlmRoutes } from './routes/llm.routes';
import { registerProfileRoutes } from './routes/profile.routes';
import { registerSessionRoutes } from './routes/sessions.routes';
import { registerTrackRoutes } from './routes/tracks.routes';

const app = Fastify({ logger: true });

await app.register(cookie, { secret: config.sessionSecret });

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

// Fire-and-forget warm-up so the first real hint/chat request doesn't pay
// Ollama's ~15-20s cold-load cost after an idle eviction.
void generateWithOllama({ prompt: 'Say hi in one word.', maxTokens: 5 }).catch(() => undefined);
