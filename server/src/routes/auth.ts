import type { FastifyInstance } from 'fastify';
import { adminExists, createUser, signToken, verifyPassword } from '../auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

export default async function authRoutes(app: FastifyInstance) {
  app.get('/auth/setup-status', async () => ({
    data: { adminExists: adminExists() },
    error: null,
  }));

  app.post('/auth/setup', async (req, reply) => {
    if (adminExists()) {
      return reply.code(409).send({ data: null, error: { message: 'Admin already exists' } });
    }
    const { email, password } = (req.body || {}) as { email?: string; password?: string };
    if (!email || !password || password.length < 8) {
      return reply.code(400).send({ data: null, error: { message: 'Invalid email or password (min 8 chars)' } });
    }
    const user = await createUser(email, password, 'admin');
    const token = signToken({ sub: user.id, email: user.email, role: 'admin' });
    return { data: { token, user }, error: null };
  });

  app.post(
    '/auth/login',
    { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
    async (req, reply) => {
      const { email, password } = (req.body || {}) as { email?: string; password?: string };
      if (!email || !password) {
        return reply.code(400).send({ data: null, error: { message: 'Missing credentials' } });
      }
      const user = await verifyPassword(email, password);
      if (!user) {
        return reply.code(401).send({ data: null, error: { message: 'Invalid credentials' } });
      }
      const token = signToken({ sub: user.id, email: user.email, role: user.role });
      return { data: { token, user }, error: null };
    },
  );

  app.get('/auth/me', { preHandler: requireAdmin }, async (req) => ({
    data: { user: req.user },
    error: null,
  }));
}