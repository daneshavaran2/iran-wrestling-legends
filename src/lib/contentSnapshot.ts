/**
 * Loads the build-time content snapshot (`/data/snapshot.json`) which contains
 * a copy of all public DB tables. Lets the app render fully even if Supabase
 * is unreachable.
 */

export interface Snapshot {
  generatedAt: string;
  version: number;
  tables: Record<string, any[]>;
}

let cache: Snapshot | null = null;
let inflight: Promise<Snapshot | null> | null = null;

export async function loadSnapshot(): Promise<Snapshot | null> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = fetch('/data/snapshot.json', { cache: 'no-cache' })
    .then((r) => (r.ok ? r.json() : null))
    .then((j: Snapshot | null) => {
      if (j && j.tables) cache = j;
      return cache;
    })
    .catch(() => null)
    .finally(() => { inflight = null; });
  return inflight;
}

export function getSnapshotSync(): Snapshot | null {
  return cache;
}

export async function getTable<T = any>(name: string): Promise<T[]> {
  const s = await loadSnapshot();
  return (s?.tables?.[name] as T[]) || [];
}

// Eagerly start loading at module import (browser only)
if (typeof window !== 'undefined') {
  void loadSnapshot();
}
