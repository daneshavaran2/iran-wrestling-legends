#!/usr/bin/env node
/**
 * build-snapshot.mjs
 *
 * Scans public/images and public/videos, generates manifest files,
 * and refreshes the `generatedAt` / `version` fields of
 * public/data/snapshot.json so the offline-first frontend always
 * boots with the latest bundled media.
 *
 * Usage:
 *   node scripts/build-snapshot.mjs            # full rebuild
 *   node scripts/build-snapshot.mjs --quick    # skip media re-scan
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, 'public');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'images');
const VIDEOS_DIR = path.join(PUBLIC_DIR, 'videos');
const DATA_DIR = path.join(PUBLIC_DIR, 'data');
const SNAPSHOT = path.join(DATA_DIR, 'snapshot.json');

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg']);
const VIDEO_EXT = new Set(['.mp4', '.webm', '.mov', '.m4v', '.ogg']);

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function walk(dir, allowed) {
  const out = [];
  let entries = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...(await walk(full, allowed)));
    } else {
      const ext = path.extname(e.name).toLowerCase();
      if (allowed.has(ext)) out.push(full);
    }
  }
  return out;
}

function toPublicPath(absolute) {
  const rel = path.relative(PUBLIC_DIR, absolute).split(path.sep).join('/');
  return '/' + rel;
}

async function buildImageManifest() {
  const files = await walk(IMAGES_DIR, IMAGE_EXT);
  const map = {};
  for (const f of files) {
    const pub = toPublicPath(f);
    const name = path.basename(f);
    map[name] = pub;          // by filename
    map[pub] = pub;            // by public path (identity)
  }
  const out = path.join(IMAGES_DIR, 'manifest.json');
  await ensureDir(IMAGES_DIR);
  await fs.writeFile(out, JSON.stringify({ images: map, count: files.length }, null, 2));
  return files.length;
}

async function buildVideoManifest() {
  const files = await walk(VIDEOS_DIR, VIDEO_EXT);
  const map = {};
  for (const f of files) {
    const pub = toPublicPath(f);
    map[path.basename(f)] = pub;
    map[pub] = pub;
  }
  const out = path.join(VIDEOS_DIR, 'manifest.json');
  await ensureDir(VIDEOS_DIR);
  await fs.writeFile(out, JSON.stringify({ videos: map, count: files.length }, null, 2));
  return files.length;
}

async function refreshSnapshot() {
  await ensureDir(DATA_DIR);
  let snap = { generatedAt: new Date().toISOString(), version: 1, tables: {} };
  try {
    const txt = await fs.readFile(SNAPSHOT, 'utf8');
    snap = JSON.parse(txt);
  } catch {
    // start fresh
  }
  snap.generatedAt = new Date().toISOString();
  snap.version = Number(snap.version || 0) + 1;
  snap.tables = snap.tables || {};
  await fs.writeFile(SNAPSHOT, JSON.stringify(snap, null, 2));
  return snap.version;
}

(async () => {
  const t0 = Date.now();
  const [img, vid, ver] = await Promise.all([
    buildImageManifest(),
    buildVideoManifest(),
    refreshSnapshot(),
  ]);
  console.log(
    `[snapshot] images=${img}  videos=${vid}  snapshot.v=${ver}  (${Date.now() - t0}ms)`
  );
})();