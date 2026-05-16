// One-shot migration: pulls all rows + storage files from Supabase into local SQLite + /data/uploads.
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... DATA_DIR=./data node scripts/migrate-from-supabase.mjs

import { createClient } from '@supabase/supabase-js';
import Database from 'better-sqlite3';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, basename, extname } from 'node:path';
import { randomUUID } from 'node:crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const DATA_DIR = process.env.DATA_DIR || './data';
const DB_PATH = `${DATA_DIR}/db.sqlite`;
const UPLOADS = `${DATA_DIR}/uploads`;
mkdirSync(UPLOADS, { recursive: true });
mkdirSync(dirname(DB_PATH), { recursive: true });

const sb = createClient(SUPABASE_URL, SERVICE_KEY);
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

const TABLES = [
  'wrestlers', 'wrestler_media', 'achievements',
  'albums', 'album_photos',
  'history_sections', 'history_media',
  'buildings', 'building_images',
  'books', 'about_media', 'app_settings', 'translations',
];

const BUCKETS = [
  ['wrestler-media', 'wrestlers'],
  ['album-media', 'albums'],
  ['building-media', 'buildings'],
  ['museum-audio', 'audio'],
];

const urlMap = new Map(); // remote URL → local path

async function downloadBuckets() {
  for (const [bucket, cat] of BUCKETS) {
    mkdirSync(`${UPLOADS}/${cat}`, { recursive: true });
    console.log(`Listing bucket ${bucket}…`);
    const queue = [''];
    while (queue.length) {
      const prefix = queue.shift();
      const { data, error } = await sb.storage.from(bucket).list(prefix, { limit: 1000 });
      if (error) { console.warn(bucket, prefix, error.message); continue; }
      for (const item of data || []) {
        const path = prefix ? `${prefix}/${item.name}` : item.name;
        if (item.id == null && !extname(item.name)) {
          queue.push(path);
          continue;
        }
        const { data: pub } = sb.storage.from(bucket).getPublicUrl(path);
        const remote = pub.publicUrl;
        const ext = extname(item.name) || '.bin';
        const local = `${UPLOADS}/${cat}/${randomUUID()}${ext}`;
        const r = await fetch(remote);
        if (!r.ok) { console.warn('skip', remote); continue; }
        const buf = Buffer.from(await r.arrayBuffer());
        writeFileSync(local, buf);
        const localUrl = `/uploads/${cat}/${basename(local)}`;
        urlMap.set(remote, localUrl);
      }
    }
  }
  console.log(`Downloaded ${urlMap.size} files`);
}

function rewriteUrls(row) {
  for (const [k, v] of Object.entries(row)) {
    if (typeof v === 'string' && urlMap.has(v)) row[k] = urlMap.get(v);
  }
  return row;
}

async function copyTable(t) {
  const { data, error } = await sb.from(t).select('*');
  if (error) { console.warn('skip', t, error.message); return; }
  if (!data?.length) return;
  const cols = Object.keys(data[0]);
  const placeholders = cols.map(() => '?').join(',');
  const stmt = db.prepare(`INSERT OR REPLACE INTO ${t} (${cols.join(',')}) VALUES (${placeholders})`);
  const tx = db.transaction((rows) => {
    for (const r of rows) {
      rewriteUrls(r);
      stmt.run(...cols.map((c) => {
        const v = r[c];
        if (typeof v === 'boolean') return v ? 1 : 0;
        if (v && typeof v === 'object') return JSON.stringify(v);
        return v ?? null;
      }));
    }
  });
  tx(data);
  console.log(`Imported ${data.length} → ${t}`);
}

await downloadBuckets();
for (const t of TABLES) await copyTable(t);
console.log('Done.');