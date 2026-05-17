import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { createWriteStream, promises as fs } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import sharp from 'sharp';
import { requireAdmin } from '../middleware/requireAdmin.js';

/**
 * Writes uploaded files directly into the frontend's `public/` tree so
 * the offline-first build embeds them. Also patches public/data/snapshot.json
 * with the new media reference.
 *
 * In production set PUBLIC_DIR to the path of the served `public/` (or a
 * mounted volume that the static server reads from). In dev it falls back
 * to ../public relative to the server cwd.
 */
const PUBLIC_DIR = process.env.PUBLIC_DIR || path.resolve(process.cwd(), '../public');

const IMAGE_MIME = /^image\//;
const VIDEO_MIME = /^video\//;

const ALLOWED_CATEGORIES = new Set([
  'wrestlers', 'albums', 'buildings', 'about', 'history', 'books', 'audio',
]);

async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

async function patchSnapshot(updater: (snap: any) => void) {
  const snapPath = path.join(PUBLIC_DIR, 'data', 'snapshot.json');
  await ensureDir(path.dirname(snapPath));
  let snap: any = { generatedAt: new Date().toISOString(), version: 1, tables: {} };
  try {
    snap = JSON.parse(await fs.readFile(snapPath, 'utf8'));
  } catch { /* fresh */ }
  snap.tables = snap.tables || {};
  updater(snap);
  snap.generatedAt = new Date().toISOString();
  snap.version = Number(snap.version || 0) + 1;
  await fs.writeFile(snapPath, JSON.stringify(snap, null, 2));
}

export default async function publicAssetRoutes(app: FastifyInstance) {
  app.post('/admin/public-assets', { preHandler: requireAdmin }, async (req, reply) => {
    const part = await req.file();
    if (!part) {
      return reply.code(400).send({ data: null, error: { message: 'No file uploaded' } });
    }

    const fields: any = part.fields || {};
    const rawCategory = fields.category?.value || 'wrestlers';
    const category = ALLOWED_CATEGORIES.has(rawCategory) ? rawCategory : 'wrestlers';
    const table: string | null = fields.table?.value || null;
    const recordId: string | null = fields.recordId?.value || null;
    const field: string = fields.field?.value || 'image_url';

    const id = randomUUID();
    let publicUrl: string;

    if (IMAGE_MIME.test(part.mimetype)) {
      const destDir = path.join(PUBLIC_DIR, 'images', category);
      await ensureDir(destDir);
      const dest = path.join(destDir, `${id}.webp`);
      const transformer = sharp()
        .rotate()
        .resize({ width: 2000, withoutEnlargement: true })
        .webp({ quality: 82 });
      await pipeline(part.file, transformer, createWriteStream(dest));
      publicUrl = `/images/${category}/${id}.webp`;
    } else if (VIDEO_MIME.test(part.mimetype)) {
      const destDir = path.join(PUBLIC_DIR, 'videos', category);
      await ensureDir(destDir);
      const ext = (part.filename.split('.').pop() || 'mp4')
        .toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp4';
      const dest = path.join(destDir, `${id}.${ext}`);
      await pipeline(part.file, createWriteStream(dest));
      publicUrl = `/videos/${category}/${id}.${ext}`;
    } else {
      return reply.code(415).send({
        data: null, error: { message: `Unsupported mime: ${part.mimetype}` },
      });
    }

    // Optionally patch the snapshot record (e.g. wrestlers.image_url).
    if (table && recordId) {
      await patchSnapshot((snap) => {
        const rows: any[] = snap.tables[table] || [];
        const idx = rows.findIndex((r) => String(r.id) === String(recordId));
        if (idx >= 0) {
          rows[idx] = { ...rows[idx], [field]: publicUrl };
          snap.tables[table] = rows;
        }
      });
    } else {
      // still bump version so frontend re-fetches
      await patchSnapshot(() => {});
    }

    return { data: { url: publicUrl, category }, error: null };
  });
}