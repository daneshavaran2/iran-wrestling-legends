#!/usr/bin/env node
/**
 * Auto-sync wrestler videos from Supabase into public/videos/ as static
 * assets. Runs as `prebuild` so plain `npm run build` is enough.
 *
 * Behavior:
 *   - Downloads new/changed videos (skips by size match).
 *   - Removes orphan local files no longer referenced.
 *   - Writes public/videos/manifest.json atomically.
 *   - Never fails the build: any Supabase/network error -> warn + exit 0.
 */
import { createClient } from '@supabase/supabase-js';
import { mkdir, writeFile, readFile, readdir, rename, unlink } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'public', 'videos');
const MANIFEST = path.join(OUT_DIR, 'manifest.json');
const KEEP = new Set(['manifest.json', '.gitkeep']);

const c = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

async function loadEnv() {
  try {
    const txt = await readFile(path.join(ROOT, '.env'), 'utf8');
    for (const line of txt.split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=["']?([^"'\n]+)["']?$/);
      if (m) process.env[m[1]] ??= m[2];
    }
  } catch {}
}

function safeName(url) {
  const ext = (url.split('?')[0].match(/\.([a-z0-9]{2,5})$/i)?.[1] || 'mp4').toLowerCase();
  const hash = createHash('sha1').update(url).digest('hex').slice(0, 16);
  return `${hash}.${ext}`;
}

async function headSize(url) {
  try {
    const r = await fetch(url, { method: 'HEAD' });
    if (!r.ok) return null;
    const len = r.headers.get('content-length');
    return len ? Number(len) : null;
  } catch { return null; }
}

async function downloadAtomic(url, dest) {
  const tmp = `${dest}.tmp`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(tmp, buf);
  await rename(tmp, dest);
  return buf.length;
}

async function loadExistingManifest() {
  try {
    const txt = await readFile(MANIFEST, 'utf8');
    const j = JSON.parse(txt);
    if (j && j.videos && typeof j.videos === 'object') return j.videos;
    if (j && typeof j === 'object') return j; // legacy flat
  } catch {}
  return {};
}

async function main() {
  await loadEnv();
  await mkdir(OUT_DIR, { recursive: true });
  // Ensure .gitkeep exists
  const gk = path.join(OUT_DIR, '.gitkeep');
  if (!existsSync(gk)) await writeFile(gk, '');

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_KEY =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  console.log(c.bold(c.cyan('\n▸ bundle-videos: syncing wrestler videos\n')));

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn(c.yellow('  ! Missing Supabase env vars — keeping previous manifest. Skipping sync.'));
    return; // exit 0
  }

  const previous = await loadExistingManifest();
  let urls;
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const set = new Set();
    const { data: wrestlers, error: wErr } = await supabase
      .from('wrestlers').select('id, intro_video_url');
    if (wErr) throw wErr;
    for (const w of wrestlers || []) if (w.intro_video_url) set.add(w.intro_video_url);
    const { data: media } = await supabase
      .from('wrestler_media').select('url, type');
    for (const m of media || []) if (m?.type === 'video' && m.url) set.add(m.url);
    urls = set;
  } catch (e) {
    console.warn(c.yellow(`  ! Supabase query failed (${e.message || e}) — keeping previous manifest.`));
    return; // exit 0, build continues with old manifest + cached files
  }

  console.log(c.dim(`  Found ${urls.size} unique video URL(s) in DB.`));

  const manifest = {};
  const wantedFiles = new Set(['manifest.json', '.gitkeep']);
  let downloaded = 0, updated = 0, skipped = 0, failed = 0, totalBytes = 0;

  for (const url of urls) {
    const fname = safeName(url);
    const dest = path.join(OUT_DIR, fname);
    wantedFiles.add(fname);
    const localPath = `/videos/${fname}`;

    try {
      const localExists = existsSync(dest);
      const localSize = localExists ? statSync(dest).size : 0;
      const remoteSize = await headSize(url);

      if (localExists && remoteSize && localSize === remoteSize) {
        manifest[url] = localPath;
        skipped++;
        console.log(c.dim(`  = ${fname}  (cached, ${(localSize/1024/1024).toFixed(2)} MB)`));
        continue;
      }

      const bytes = await downloadAtomic(url, dest);
      manifest[url] = localPath;
      totalBytes += bytes;
      if (localExists) {
        updated++;
        console.log(c.cyan(`  ↻ ${fname}  (updated, ${(bytes/1024/1024).toFixed(2)} MB)`));
      } else {
        downloaded++;
        console.log(c.green(`  + ${fname}  (new, ${(bytes/1024/1024).toFixed(2)} MB)`));
      }
    } catch (e) {
      failed++;
      // keep previous mapping if the file still exists locally
      if (previous[url] && existsSync(path.join(ROOT, 'public', previous[url].replace(/^\//, '')))) {
        manifest[url] = previous[url];
        wantedFiles.add(path.basename(previous[url]));
        console.warn(c.yellow(`  ! ${fname}  download failed (${e.message}) — using cached copy`));
      } else {
        console.warn(c.red(`  ✗ ${fname}  download failed (${e.message})`));
      }
    }
  }

  // Prune orphans
  let removed = 0;
  try {
    const entries = await readdir(OUT_DIR);
    for (const f of entries) {
      if (wantedFiles.has(f)) continue;
      try {
        await unlink(path.join(OUT_DIR, f));
        removed++;
        console.log(c.yellow(`  − ${f}  (removed orphan)`));
      } catch {}
    }
  } catch {}

  // Atomic manifest write
  const payload = {
    generatedAt: new Date().toISOString(),
    count: Object.keys(manifest).length,
    videos: manifest,
  };
  const tmp = `${MANIFEST}.tmp`;
  await writeFile(tmp, JSON.stringify(payload, null, 2));
  await rename(tmp, MANIFEST);

  console.log(
    c.bold(`\n  ✓ Sync complete `) +
    c.dim(`(downloaded=${downloaded} updated=${updated} skipped=${skipped} removed=${removed} failed=${failed} size=${(totalBytes/1024/1024).toFixed(2)} MB)\n`)
  );
}

main().catch((e) => {
  console.warn(`\x1b[33m  ! bundle-videos crashed: ${e.message} — continuing build.\x1b[0m`);
  process.exit(0);
});
