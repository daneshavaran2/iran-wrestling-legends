import type { FastifyReply, FastifyRequest } from 'fastify';
import { verifyToken, type JwtPayload } from '../auth.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}

export async function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== 'admin') {
    return reply.code(401).send({ data: null, error: { message: 'Admin required' } });
  }
  req.user = payload;
}

export async function optionalAuth(req: FastifyRequest) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (token) req.user = verifyToken(token) || undefined;
}