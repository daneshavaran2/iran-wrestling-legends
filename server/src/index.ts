import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import fStatic from '@fastify/static';
import { resolve } from 'node:path';
import { CORS_ORIGIN, HOST, PORT, UPLOADS_DIR } from './env.js';
import authRoutes from './routes/auth.js';
import crudRoutes from './routes/crud.js';
import uploadRoutes from './routes/uploads.js';
import aiRoutes from './routes/ai.js';

const app = Fastify({ logger: true, bodyLimit: 20 * 1024 * 1024 });

await app.register(helmet, { contentSecurityPolicy: false });
await app.register(cors, {
  origin: CORS_ORIGIN.includes('*') ? true : CORS_ORIGIN,
  credentials: false,
});
await app.register(rateLimit, { global: false });
await app.register(multipart, { limits: { fileSize: 200 * 1024 * 1024 } });

// Serve uploaded files when nginx isn't in front (e.g. dev).
await app.register(fStatic, {
  root: resolve(UPLOADS_DIR),
  prefix: '/uploads/',
  decorateReply: false,
});

app.get('/health', async () => ({ status: 'ok' }));

await app.register(authRoutes, { prefix: '/api' });
await app.register(crudRoutes, { prefix: '/api' });
await app.register(uploadRoutes, { prefix: '/api' });
await app.register(aiRoutes, { prefix: '/api' });

app.listen({ port: PORT, host: HOST }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});