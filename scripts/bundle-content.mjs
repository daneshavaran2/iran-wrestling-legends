#!/usr/bin/env node
/**
 * Auto-sync ALL public Supabase content into static bundle:
 *   - public/data/snapshot.json    (all tables — text content)
 *   - public/videos/<hash>.<ext>   (intro + media videos) + manifest.json
 *
 * Runs as `prebuild` so plain `npm run build` is enough.
 * Never fails the build: any Supabase/network error -> warn + exit 0,
 * previous snapshot/files preserved.
 */
import { createClient } from '@supabase/supabase-js';
import { mkdir, writeFile, readFile, readdir, rename, unlink } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, 'public');
const DATA_DIR = path.join(PUBLIC_DIR, 'data');
const SNAPSHOT = path.join(DATA_DIR, 'snapshot.json');
const VIDEO_DIR = path.join(PUBLIC_DIR, 'videos');
const VIDEO_MANIFEST = path.join(VIDEO_DIR, 'manifest.json');
const VIDEO_KEEP = new Set(['manifest.json', '.gitkeep']);

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

async function loadJSON(file, fallback) {
  try { return JSON.parse(await readFile(file, 'utf8')); } catch { return fallback; }
}

async function fetchAll(supabase, table, select = '*', orderBy) {
  let q = supabase.from(table).select(select);
  if (orderBy) q = q.order(orderBy);
  const { data, error } = await q;
  if (error) throw new Error(`${table}: ${error.message}`);
  return data || [];
}

async function syncSnapshot(supabase) {
  console.log(c.bold(c.cyan('\n▸ snapshot: bundling DB tables\n')));
  await mkdir(DATA_DIR, { recursive: true });
  const previous = await loadJSON(SNAPSHOT, null);

  const TABLES = [
    ['wrestlers', '*', 'name'],
    ['wrestler_media', '*', 'display_order'],
    ['achievements', '*', 'year'],
    ['history_sections', '*', 'display_order'],
    ['history_media', '*', 'display_order'],
    ['buildings', '*', 'display_order'],
    ['building_images', '*', 'display_order'],
    ['albums', '*', 'display_order'],
    ['album_photos', '*', 'display_order'],
    ['books', '*', 'display_order'],
    ['about_media', '*', 'display_order'],
    ['app_settings', '*', null],
  ];

  const snapshot = { generatedAt: new Date().toISOString(), version: 1, tables: {} };
  let okCount = 0, failCount = 0;

  for (const [t, sel, ord] of TABLES) {
    try {
      const rows = await fetchAll(supabase, t, sel, ord);
      snapshot.tables[t] = rows;
      okCount++;
      console.log(c.green(`  + ${t.padEnd(20)} ${rows.length} rows`));
    } catch (e) {
      failCount++;
      // keep previous data for this table if available
      if (previous?.tables?.[t]) {
        snapshot.tables[t] = previous.tables[t];
        console.warn(c.yellow(`  ! ${t.padEnd(20)} failed (${e.message}) — kept previous (${previous.tables[t].length})`));
      } else {
        snapshot.tables[t] = [];
        console.warn(c.red(`  ✗ ${t.padEnd(20)} failed (${e.message}) — empty`));
      }
    }
  }

  // If literally nothing succeeded and we had previous snapshot, keep old file untouched
  if (okCount === 0 && previous) {
    console.warn(c.yellow('\n  ! All tables failed — preserving previous snapshot.json'));
    return previous;
  }
  // If literally nothing succeeded and no previous snapshot exists, do not write
  // an empty snapshot (would clobber any committed bundle on next read).
  if (okCount === 0 && !previous) {
    console.warn(c.yellow('\n  ! All tables failed and no previous snapshot — skipping write.'));
    return { tables: {} };
  }

  return snapshot;
}

async function syncVideos(snapshot) {
  console.log(c.bold(c.cyan('▸ videos: syncing to public/videos\n')));
  await mkdir(VIDEO_DIR, { recursive: true });
  const gk = path.join(VIDEO_DIR, '.gitkeep');
  if (!existsSync(gk)) await writeFile(gk, '');

  const previousManifest = (await loadJSON(VIDEO_MANIFEST, {}))?.videos || {};

  const urls = new Set();
  for (const w of snapshot.tables.wrestlers || []) if (w.intro_video_url) urls.add(w.intro_video_url);
  for (const m of snapshot.tables.wrestler_media || []) if (m?.type === 'video' && m.url) urls.add(m.url);
  for (const m of snapshot.tables.history_media || []) if (m?.type === 'video' && m.url) urls.add(m.url);
  for (const m of snapshot.tables.about_media || []) if (m?.type === 'video' && m.url) urls.add(m.url);

  console.log(c.dim(`  Found ${urls.size} unique video URL(s).`));

  const manifest = {};
  const wantedFiles = new Set(['manifest.json', '.gitkeep']);
  let downloaded = 0, updated = 0, skipped = 0, failed = 0, totalBytes = 0;

  for (const url of urls) {
    const fname = safeName(url);
    const dest = path.join(VIDEO_DIR, fname);
    wantedFiles.add(fname);
    const localPath = `/videos/${fname}`;

    try {
      const localExists = existsSync(dest);
      const localSize = localExists ? statSync(dest).size : 0;
      const remoteSize = await headSize(url);

      if (localExists && remoteSize && localSize === remoteSize) {
        manifest[url] = localPath;
        skipped++;
        console.log(c.dim(`  = ${fname} (cached, ${(localSize/1024/1024).toFixed(2)} MB)`));
        continue;
      }
      const bytes = await downloadAtomic(url, dest);
      if (existsSync(dest) && statSync(dest).size > 0) manifest[url] = localPath;
      totalBytes += bytes;
      if (localExists) {
        updated++;
        console.log(c.cyan(`  ↻ ${fname} (updated, ${(bytes/1024/1024).toFixed(2)} MB)`));
      } else {
        downloaded++;
        console.log(c.green(`  + ${fname} (new, ${(bytes/1024/1024).toFixed(2)} MB)`));
      }
    } catch (e) {
      failed++;
      const prev = previousManifest[url];
      const prevPath = prev ? path.join(PUBLIC_DIR, prev.replace(/^\//, '')) : null;
      if (prev && prevPath && existsSync(prevPath) && statSync(prevPath).size > 0) {
        manifest[url] = prev;
        wantedFiles.add(path.basename(prev));
        console.warn(c.yellow(`  ! ${fname} failed (${e.message}) — using cached`));
      } else {
        console.warn(c.red(`  ✗ ${fname} failed (${e.message}) — remote fallback`));
      }
    }
  }

  let removed = 0;
  try {
    for (const f of await readdir(VIDEO_DIR)) {
      if (wantedFiles.has(f)) continue;
      try { await unlink(path.join(VIDEO_DIR, f)); removed++; console.log(c.yellow(`  − ${f} (orphan)`)); } catch {}
    }
  } catch {}

  const payload = {
    generatedAt: new Date().toISOString(),
    count: Object.keys(manifest).length,
    videos: manifest,
  };
  const tmp = `${VIDEO_MANIFEST}.tmp`;
  await writeFile(tmp, JSON.stringify(payload, null, 2));
  await rename(tmp, VIDEO_MANIFEST);

  console.log(c.bold(`\n  ✓ videos done `) + c.dim(`(d=${downloaded} u=${updated} s=${skipped} r=${removed} f=${failed} ${(totalBytes/1024/1024).toFixed(2)} MB)\n`));
  return manifest;
}

/**
 * Rewrite remote video URLs inside the snapshot to local /videos/<file> paths
 * for any URL that successfully downloaded. The original remote URL is kept
 * in a sibling `__remoteUrl` field for optional background refresh later.
 */
function rewriteSnapshotVideoUrls(snapshot, manifest) {
  if (!snapshot?.tables || !manifest) return 0;
  let rewrites = 0;

  const swap = (row, field) => {
    const url = row?.[field];
    if (!url || typeof url !== 'string') return;
    const local = manifest[url];
    if (local && local !== url) {
      row.__remoteUrl = row.__remoteUrl || {};
      row.__remoteUrl[field] = url;
      row[field] = local;
      rewrites++;
    }
  };

  for (const w of snapshot.tables.wrestlers || []) swap(w, 'intro_video_url');
  for (const m of snapshot.tables.wrestler_media || []) {
    if (m?.type === 'video') swap(m, 'url');
  }
  for (const m of snapshot.tables.history_media || []) {
    if (m?.type === 'video') swap(m, 'url');
  }
  for (const m of snapshot.tables.about_media || []) {
    if (m?.type === 'video') swap(m, 'url');
  }
  return rewrites;
}

async function writeSnapshot(snapshot) {
  if (!snapshot?.tables || !Object.keys(snapshot.tables).length) return;
  const tmp = `${SNAPSHOT}.tmp`;
  await writeFile(tmp, JSON.stringify(snapshot));
  await rename(tmp, SNAPSHOT);
}

async function main() {
  await loadEnv();
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn(c.yellow('  ! Missing Supabase env vars — keeping previous bundle. Skipping sync.'));
    return;
  }

  let supabase;
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  } catch (e) {
    console.warn(c.yellow(`  ! Supabase client init failed (${e.message}) — skipping.`));
    return;
  }

  let snapshot;
  try {
    snapshot = await syncSnapshot(supabase);
  } catch (e) {
    console.warn(c.yellow(`  ! Snapshot sync crashed (${e.message}) — using previous snapshot.json if any.`));
    snapshot = await loadJSON(SNAPSHOT, { tables: {} });
  }

  let manifest = {};
  try {
    manifest = (await syncVideos(snapshot)) || {};
  } catch (e) {
    console.warn(c.yellow(`  ! Video sync crashed (${e.message}) — continuing.`));
  }

  // Rewrite remote URLs to local /videos/* in the snapshot, then persist.
  try {
    const n = rewriteSnapshotVideoUrls(snapshot, manifest);
    if (n > 0) console.log(c.cyan(`  ↻ rewrote ${n} video URL(s) to local paths in snapshot`));
    await writeSnapshot(snapshot);
    console.log(c.bold(c.green('  ✓ snapshot.json written\n')));
  } catch (e) {
    console.warn(c.yellow(`  ! Failed to write snapshot.json (${e.message}) — previous file preserved.`));
  }
}

main().catch((e) => {
  console.warn(`\x1b[33m  ! bundle-content crashed: ${e.message} — continuing build.\x1b[0m`);
  process.exit(0);
});
