#!/usr/bin/env node
/**
 * Bundle wrestler intro videos + media videos into public/videos/ as static
 * assets, so the deployed app can play them instantly without contacting
 * Supabase. Also writes public/videos/manifest.json mapping the original
 * remote URL -> local /videos/<file> path.
 *
 * Usage:
 *   node scripts/bundle-videos.mjs
 *
 * Reads VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY from .env.
 */
import { createClient } from '@supabase/supabase-js';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'public', 'videos');
const MANIFEST = path.join(OUT_DIR, 'manifest.json');

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

async function downloadOne(url, dest) {
  if (existsSync(dest)) return { skipped: true };
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  return { bytes: buf.length };
}

async function main() {
  await loadEnv();
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_KEY =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY in .env');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  await mkdir(OUT_DIR, { recursive: true });

  const urls = new Set();

  const { data: wrestlers, error: wErr } = await supabase
    .from('wrestlers')
    .select('id, intro_video_url');
  if (wErr) throw wErr;
  for (const w of wrestlers || []) {
    if (w.intro_video_url) urls.add(w.intro_video_url);
  }

  const { data: media, error: mErr } = await supabase
    .from('wrestler_media')
    .select('url, type');
  if (!mErr) {
    for (const m of media || []) {
      if (m?.type === 'video' && m.url) urls.add(m.url);
    }
  }

  console.log(`Found ${urls.size} unique videos.`);

  const manifest = {};
  let ok = 0, fail = 0, skipped = 0, totalBytes = 0;

  for (const url of urls) {
    const fname = safeName(url);
    const dest = path.join(OUT_DIR, fname);
    try {
      const r = await downloadOne(url, dest);
      manifest[url] = `/videos/${fname}`;
      if (r.skipped) { skipped++; console.log(`  = ${fname} (cached)`); }
      else { ok++; totalBytes += r.bytes; console.log(`  + ${fname} (${(r.bytes/1024/1024).toFixed(2)} MB)`); }
    } catch (e) {
      fail++;
      console.warn(`  ! ${url}: ${e.message}`);
    }
  }

  await writeFile(MANIFEST, JSON.stringify(manifest, null, 2));
  console.log(`\nDone. downloaded=${ok} skipped=${skipped} failed=${fail} size=${(totalBytes/1024/1024).toFixed(2)} MB`);
  console.log(`Manifest: ${MANIFEST}`);
}

main().catch((e) => { console.error(e); process.exit(1); });