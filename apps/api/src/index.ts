import cookie from '@fastify/cookie';
import Fastify from 'fastify';

import { registerAuthRoutes } from './auth/google';
import { config } from './config';
import { registerAttemptRoutes } from './routes/attempts.routes';
import { registerLlmRoutes } from './routes/llm.routes';
import { registerSessionRoutes } from './routes/sessions.routes';
import { registerTrackRoutes } from './routes/tracks.routes';

const app = Fastify({ logger: true });

await app.register(cookie, { secret: config.sessionSecret });

app.get('/api/health', async () => ({ status: 'ok' }));

registerAuthRoutes(app);
registerTrackRoutes(app);
registerSessionRoutes(app);
registerAttemptRoutes(app);
registerLlmRoutes(app);

app.listen({ port: config.port, host: '0.0.0.0' }).catch((error) => {
  app.log.error(error);
  process.exit(1);
});
