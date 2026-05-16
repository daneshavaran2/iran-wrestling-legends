import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import sharp from 'sharp';
import { UPLOADS_DIR } from '../env.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const IMAGE_MIME = /^image\//;
const ALLOWED_CATEGORIES = new Set([
  'wrestlers', 'albums', 'buildings', 'about', 'audio', 'history', 'books',
]);

export default async function uploadRoutes(app: FastifyInstance) {
  app.post('/uploads', { preHandler: requireAdmin }, async (req, reply) => {
    const part = await req.file();
    if (!part) return reply.code(400).send({ data: null, error: { message: 'No file uploaded' } });

    const rawCat = (part.fields?.category as any)?.value || 'wrestlers';
    const category = ALLOWED_CATEGORIES.has(rawCat) ? rawCat : 'wrestlers';
    const id = randomUUID();

    if (IMAGE_MIME.test(part.mimetype)) {
      const dest = `${UPLOADS_DIR}/${category}/${id}.webp`;
      const transformer = sharp().rotate().resize({ width: 2000, withoutEnlargement: true }).webp({ quality: 82 });
      await pipeline(part.file, transformer, createWriteStream(dest));
      return { data: { url: `/uploads/${category}/${id}.webp` }, error: null };
    }

    // pass-through for video / audio
    const ext = (part.filename.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
    const dest = `${UPLOADS_DIR}/${category}/${id}.${ext}`;
    await pipeline(part.file, createWriteStream(dest));
    return { data: { url: `/uploads/${category}/${id}.${ext}` }, error: null };
  });
}