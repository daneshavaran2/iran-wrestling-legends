#!/usr/bin/env node
/**
 * Post-build verification: ensures dist/ (or build/) contains the
 * snapshot and media manifests. Logs total bundled media size so the
 * operator can spot regressions before deploy.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CANDIDATES = ['dist', 'build'];

async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function dirSize(dir) {
  let total = 0;
  let entries = [];
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return 0; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) total += await dirSize(full);
    else {
      try { total += (await fs.stat(full)).size; } catch {}
    }
  }
  return total;
}

function fmt(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

(async () => {
  for (const c of CANDIDATES) {
    const base = path.join(ROOT, c);
    if (!(await exists(base))) continue;
    const required = ['data/snapshot.json', 'images', 'videos'];
    const missing = [];
    for (const r of required) {
      if (!(await exists(path.join(base, r)))) missing.push(r);
    }
    const [imgSize, vidSize] = await Promise.all([
      dirSize(path.join(base, 'images')),
      dirSize(path.join(base, 'videos')),
    ]);
    console.log(`[verify] ${c}/  images=${fmt(imgSize)}  videos=${fmt(vidSize)}` +
      (missing.length ? `  MISSING: ${missing.join(', ')}` : '  OK'));
  }
})();