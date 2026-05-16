/**
 * Offline-only data shim — replaces Supabase entirely.
 *
 * All public museum content is read from `/data/snapshot.json` (loaded via
 * `loadSnapshot()`). Writes, auth, storage, edge functions, and realtime are
 * no-ops that return predictable errors so legacy admin code does not crash.
 *
 * No network call is ever made to Supabase from this module.
 */

import { loadSnapshot, getSnapshotSync } from '@/lib/contentSnapshot';

const READONLY_ERROR = {
  message: 'Offline kiosk mode — writes are disabled.',
  name: 'OfflineReadOnlyError',
  code: 'OFFLINE_READONLY',
};

function getRows(table: string): any[] {
  const snap = getSnapshotSync();
  const rows = snap?.tables?.[table];
  return Array.isArray(rows) ? rows.slice() : [];
}

async function ensureLoaded(): Promise<void> {
  if (!getSnapshotSync()) await loadSnapshot();
}

type Filter = (row: any) => boolean;

class QueryBuilder {
  private table: string;
  private filters: Filter[] = [];
  private orderings: Array<{ col: string; asc: boolean }> = [];
  private limitN: number | null = null;
  private rangeFrom: number | null = null;
  private rangeTo: number | null = null;
  private mode: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private wantSingle: 'single' | 'maybeSingle' | null = null;
  private wantCount: 'exact' | 'planned' | 'estimated' | null = null;

  constructor(table: string) {
    this.table = table;
  }

  select(_cols?: string, opts?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }) {
    this.mode = this.mode === 'select' ? 'select' : this.mode;
    if (opts?.count) this.wantCount = opts.count;
    return this;
  }
  insert(_rows: any) { this.mode = 'insert'; return this; }
  update(_rows: any) { this.mode = 'update'; return this; }
  upsert(_rows: any) { this.mode = 'upsert'; return this; }
  delete() { this.mode = 'delete'; return this; }

  eq(col: string, val: any) { this.filters.push((r) => r?.[col] === val); return this; }
  neq(col: string, val: any) { this.filters.push((r) => r?.[col] !== val); return this; }
  gt(col: string, val: any) { this.filters.push((r) => r?.[col] > val); return this; }
  gte(col: string, val: any) { this.filters.push((r) => r?.[col] >= val); return this; }
  lt(col: string, val: any) { this.filters.push((r) => r?.[col] < val); return this; }
  lte(col: string, val: any) { this.filters.push((r) => r?.[col] <= val); return this; }
  is(col: string, val: any) { this.filters.push((r) => r?.[col] === val); return this; }
  in(col: string, vals: any[]) { this.filters.push((r) => vals.includes(r?.[col])); return this; }
  like(col: string, pat: string) {
    const re = new RegExp('^' + pat.replace(/%/g, '.*').replace(/_/g, '.') + '$');
    this.filters.push((r) => re.test(String(r?.[col] ?? '')));
    return this;
  }
  ilike(col: string, pat: string) {
    const re = new RegExp('^' + pat.replace(/%/g, '.*').replace(/_/g, '.') + '$', 'i');
    this.filters.push((r) => re.test(String(r?.[col] ?? '')));
    return this;
  }
  match(obj: Record<string, any>) {
    for (const [k, v] of Object.entries(obj)) this.eq(k, v);
    return this;
  }
  or(_expr: string) { return this; }
  filter(_col: string, _op: string, _val: any) { return this; }
  order(col: string, opts?: { ascending?: boolean }) {
    this.orderings.push({ col, asc: opts?.ascending !== false });
    return this;
  }
  limit(n: number) { this.limitN = n; return this; }
  range(from: number, to: number) { this.rangeFrom = from; this.rangeTo = to; return this; }
  single() { this.wantSingle = 'single'; return this; }
  maybeSingle() { this.wantSingle = 'maybeSingle'; return this; }
  abortSignal(_s: AbortSignal) { return this; }
  returns<_T>() { return this; }

  private async run(): Promise<{ data: any; error: any; count: number | null }> {
    await ensureLoaded();

    if (this.mode !== 'select') {
      // All writes are no-ops in offline mode.
      return { data: null, error: { ...READONLY_ERROR }, count: null };
    }

    let rows = getRows(this.table);
    for (const f of this.filters) rows = rows.filter(f);
    for (const { col, asc } of this.orderings) {
      rows.sort((a, b) => {
        const av = a?.[col];
        const bv = b?.[col];
        if (av == null && bv == null) return 0;
        if (av == null) return asc ? -1 : 1;
        if (bv == null) return asc ? 1 : -1;
        if (av < bv) return asc ? -1 : 1;
        if (av > bv) return asc ? 1 : -1;
        return 0;
      });
    }
    const count = this.wantCount ? rows.length : null;
    if (this.rangeFrom != null && this.rangeTo != null) {
      rows = rows.slice(this.rangeFrom, this.rangeTo + 1);
    }
    if (this.limitN != null) rows = rows.slice(0, this.limitN);

    if (this.wantSingle === 'single') {
      if (rows.length === 0) {
        return { data: null, error: { message: 'No rows', code: 'PGRST116' }, count };
      }
      return { data: rows[0], error: null, count };
    }
    if (this.wantSingle === 'maybeSingle') {
      return { data: rows[0] ?? null, error: null, count };
    }
    return { data: rows, error: null, count };
  }

  then<TR1 = any, TR2 = never>(
    onfulfilled?: ((value: any) => TR1 | PromiseLike<TR1>) | null,
    onrejected?: ((reason: any) => TR2 | PromiseLike<TR2>) | null,
  ): Promise<TR1 | TR2> {
    return this.run().then(onfulfilled as any, onrejected as any);
  }
  catch<TR = never>(onrejected?: ((reason: any) => TR | PromiseLike<TR>) | null): Promise<any> {
    return this.run().catch(onrejected as any);
  }
  finally(onfinally?: (() => void) | null): Promise<any> {
    return this.run().finally(onfinally as any);
  }
}

// ---------- Storage stub (always read-only / no-op) ----------
const storageBucket = (_bucket: string) => ({
  upload: async () => ({ data: null, error: { ...READONLY_ERROR } }),
  uploadToSignedUrl: async () => ({ data: null, error: { ...READONLY_ERROR } }),
  download: async () => ({ data: null, error: { ...READONLY_ERROR } }),
  remove: async () => ({ data: null, error: { ...READONLY_ERROR } }),
  list: async () => ({ data: [], error: null }),
  getPublicUrl: (path: string) => ({ data: { publicUrl: path } }),
  createSignedUrl: async () => ({ data: null, error: { ...READONLY_ERROR } }),
  createSignedUploadUrl: async () => ({ data: null, error: { ...READONLY_ERROR } }),
  move: async () => ({ data: null, error: { ...READONLY_ERROR } }),
  copy: async () => ({ data: null, error: { ...READONLY_ERROR } }),
});

// ---------- Auth stub (always logged-out) ----------
const authStub = {
  getSession: async () => ({ data: { session: null }, error: null }),
  getUser: async () => ({ data: { user: null }, error: null }),
  signInWithPassword: async () => ({
    data: { user: null, session: null },
    error: { message: 'Authentication disabled in offline kiosk mode.' },
  }),
  signUp: async () => ({
    data: { user: null, session: null },
    error: { message: 'Authentication disabled in offline kiosk mode.' },
  }),
  signOut: async () => ({ error: null }),
  resetPasswordForEmail: async () => ({ data: null, error: { ...READONLY_ERROR } }),
  updateUser: async () => ({ data: { user: null }, error: { ...READONLY_ERROR } }),
  onAuthStateChange: (_cb: any) => ({
    data: { subscription: { unsubscribe: () => {} } },
  }),
  setSession: async () => ({ data: { session: null }, error: null }),
  refreshSession: async () => ({ data: { session: null }, error: null }),
};

// ---------- Functions stub ----------
const functionsStub = {
  invoke: async (_name: string, _opts?: any) => ({
    data: null,
    error: { message: 'Edge functions disabled in offline kiosk mode.' },
  }),
};

// ---------- Realtime stub ----------
const channelStub = () => {
  const ch: any = {
    on: () => ch,
    subscribe: () => ch,
    unsubscribe: async () => 'ok',
    send: async () => 'ok',
  };
  return ch;
};

export const supabase: any = {
  from: (table: string) => new QueryBuilder(table),
  storage: { from: storageBucket },
  auth: authStub,
  functions: functionsStub,
  channel: channelStub,
  removeChannel: () => 'ok',
  removeAllChannels: () => 'ok',
  getChannels: () => [],
  rpc: async () => ({ data: null, error: { ...READONLY_ERROR } }),
};

// Legacy exports kept for backwards-compat with existing imports.
export const supabaseUrl = '';

export const testConnection = async (): Promise<boolean> => false;

export async function fetchWithRetry<T>(fetchFn: () => Promise<T>): Promise<T> {
  return fetchFn();
}

export async function healthCheck(): Promise<{
  status: 'healthy' | 'degraded' | 'offline';
  latency: number;
}> {
  return { status: 'offline', latency: 0 };
}
