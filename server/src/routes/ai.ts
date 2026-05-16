import type { FastifyInstance } from 'fastify';
import { LOVABLE_API_KEY } from '../env.js';

export default async function aiRoutes(app: FastifyInstance) {
  // Thin proxy to Lovable AI Gateway so the API key never reaches the browser.
  app.post('/ai/chat', async (req, reply) => {
    if (!LOVABLE_API_KEY) {
      return reply.code(503).send({ data: null, error: { message: 'AI Gateway not configured' } });
    }
    const body = req.body || {};
    const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Lovable-API-Key': LOVABLE_API_KEY,
      },
      body: JSON.stringify(body),
    });
    reply.code(r.status);
    r.headers.forEach((v, k) => {
      if (k.toLowerCase() === 'content-type') reply.header('content-type', v);
    });
    return reply.send(await r.text());
  });
}