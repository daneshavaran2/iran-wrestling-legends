/**
 * Backend shim — talks to the Node.js (Fastify + SQLite) API instead of Supabase.
 * Keeps the `supabase.from(...).select().eq()...` surface so existing pages
 * do not need rewrites. Falls back to the local snapshot for reads when the
 * network is unavailable (kiosk offline mode).
 */

import { loadSnapshot, getSnapshotSync } from '@/lib/contentSnapshot';
import { apiFetch, buildQuery, getToken, setToken } from '@/lib/apiClient';

const READONLY_ERROR = {
  message: 'Backend unreachable — write disabled.',
  name: 'BackendUnreachable',
  code: 'BACKEND_UNREACHABLE',
};

function getSnapshotRows(table: string): any[] {
  const snap = getSnapshotSync();
  const rows = snap?.tables?.[table];
  return Array.isArray(rows) ? rows.slice() : [];
}

async function ensureSnapshotLoaded(): Promise<void> {
  if (!getSnapshotSync()) await loadSnapshot();
}

function serialize(v: any): string {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return String(v);
}

type Filter = (row: any) => boolean;
type ServerFilter = { key: string; value: string };

class QueryBuilder {
  private table: string;
  private filters: Filter[] = [];
  private serverFilters: ServerFilter[] = [];
  private orderings: Array<{ col: string; asc: boolean }> = [];
  private limitN: number | null = null;
  private rangeFrom: number | null = null;
  private rangeTo: number | null = null;
  private mode: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private writeBody: any = null;
  private wantSingle: 'single' | 'maybeSingle' | null = null;
  private wantCount: 'exact' | 'planned' | 'estimated' | null = null;

  constructor(table: string) { this.table = table; }

  select(_cols?: string, opts?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }) {
    if (opts?.count) this.wantCount = opts.count;
    return this;
  }
  insert(rows: any) { this.mode = 'insert'; this.writeBody = rows; return this; }
  update(rows: any) { this.mode = 'update'; this.writeBody = rows; return this; }
  upsert(rows: any) { this.mode = 'upsert'; this.writeBody = rows; return this; }
  delete() { this.mode = 'delete'; return this; }

  eq(col: string, val: any) {
    this.filters.push((r) => r?.[col] === val);
    this.serverFilters.push({ key: `${col}.eq`, value: serialize(val) });
    return this;
  }
  neq(col: string, val: any) {
    this.filters.push((r) => r?.[col] !== val);
    this.serverFilters.push({ key: `${col}.neq`, value: serialize(val) });
    return this;
  }
  gt(col: string, val: any) {
    this.filters.push((r) => r?.[col] > val);
    this.serverFilters.push({ key: `${col}.gt`, value: serialize(val) });
    return this;
  }
  gte(col: string, val: any) {
    this.filters.push((r) => r?.[col] >= val);
    this.serverFilters.push({ key: `${col}.gte`, value: serialize(val) });
    return this;
  }
  lt(col: string, val: any) {
    this.filters.push((r) => r?.[col] < val);
    this.serverFilters.push({ key: `${col}.lt`, value: serialize(val) });
    return this;
  }
  lte(col: string, val: any) {
    this.filters.push((r) => r?.[col] <= val);
    this.serverFilters.push({ key: `${col}.lte`, value: serialize(val) });
    return this;
  }
  is(col: string, val: any) {
    this.filters.push((r) => r?.[col] === val);
    this.serverFilters.push({ key: `${col}.is`, value: serialize(val) });
    return this;
  }
  in(col: string, vals: any[]) {
    this.filters.push((r) => vals.includes(r?.[col]));
    this.serverFilters.push({ key: `${col}.in`, value: vals.map(serialize).join(',') });
    return this;
  }
  like(col: string, pat: string) {
    const re = new RegExp('^' + pat.replace(/%/g, '.*').replace(/_/g, '.') + '$');
    this.filters.push((r) => re.test(String(r?.[col] ?? '')));
    this.serverFilters.push({ key: `${col}.like`, value: pat });
    return this;
  }
  ilike(col: string, pat: string) {
    const re = new RegExp('^' + pat.replace(/%/g, '.*').replace(/_/g, '.') + '$', 'i');
    this.filters.push((r) => re.test(String(r?.[col] ?? '')));
    this.serverFilters.push({ key: `${col}.ilike`, value: pat });
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

  private buildPath(): string {
    const params: Record<string, string> = {};
    for (const f of this.serverFilters) params[f.key] = f.value;
    if (this.orderings.length) {
      params.order = this.orderings.map((o) => `${o.col}.${o.asc ? 'asc' : 'desc'}`).join(',');
    }
    if (this.limitN != null) params.limit = String(this.limitN);
    if (this.rangeFrom != null) params.offset = String(this.rangeFrom);
    if (this.rangeFrom != null && this.rangeTo != null && this.limitN == null) {
      params.limit = String(this.rangeTo - this.rangeFrom + 1);
    }
    return `/${this.table}${buildQuery(params)}`;
  }

  private idFromFilters(): string | null {
    const f = this.serverFilters.find((x) => x.key === 'id.eq');
    return f ? f.value : null;
  }

  private async runSelect(): Promise<{ data: any; error: any; count: number | null }> {
    // Reads always come from the bundled offline snapshot — never the network.
    await ensureSnapshotLoaded();
    let rows: any[] = getSnapshotRows(this.table);
    for (const f of this.filters) rows = rows.filter(f);
    for (const { col, asc } of this.orderings) {
      rows.sort((a, b) => {
        const av = a?.[col]; const bv = b?.[col];
        if (av == null && bv == null) return 0;
        if (av == null) return asc ? -1 : 1;
        if (bv == null) return asc ? 1 : -1;
        if (av < bv) return asc ? -1 : 1;
        if (av > bv) return asc ? 1 : -1;
        return 0;
      });
    }
    if (this.rangeFrom != null && this.rangeTo != null) {
      rows = rows.slice(this.rangeFrom, this.rangeTo + 1);
    }
    if (this.limitN != null) rows = rows.slice(0, this.limitN);
    const count = this.wantCount ? rows.length : null;
    if (this.wantSingle === 'single') {
      if (rows.length === 0) return { data: null, error: { message: 'No rows', code: 'PGRST116' }, count };
      return { data: rows[0], error: null, count };
    }
    if (this.wantSingle === 'maybeSingle') {
      return { data: rows[0] ?? null, error: null, count };
    }
    return { data: rows, error: null, count };
  }

  private async runWrite(): Promise<{ data: any; error: any; count: number | null }> {
    if (this.mode === 'insert') {
      const res = await apiFetch<any>(`/${this.table}`, {
        method: 'POST', body: JSON.stringify(this.writeBody),
      });
      return { data: res.data, error: res.error, count: null };
    }
    if (this.mode === 'upsert') {
      const rows = Array.isArray(this.writeBody) ? this.writeBody : [this.writeBody];
      const out: any[] = [];
      for (const r of rows) {
        if (r?.id) {
          const up = await apiFetch<any>(`/${this.table}/${r.id}`, { method: 'PUT', body: JSON.stringify(r) });
          if (up.error) return { data: null, error: up.error, count: null };
          out.push(up.data);
        } else {
          const ins = await apiFetch<any>(`/${this.table}`, { method: 'POST', body: JSON.stringify(r) });
          if (ins.error) return { data: null, error: ins.error, count: null };
          out.push(ins.data);
        }
      }
      return { data: Array.isArray(this.writeBody) ? out : out[0], error: null, count: null };
    }
    if (this.mode === 'update') {
      const id = this.idFromFilters();
      if (!id) return { data: null, error: { message: 'update requires .eq("id", ...)' }, count: null };
      const res = await apiFetch<any>(`/${this.table}/${id}`, {
        method: 'PATCH', body: JSON.stringify(this.writeBody),
      });
      return { data: res.data, error: res.error, count: null };
    }
    if (this.mode === 'delete') {
      const id = this.idFromFilters();
      if (!id) return { data: null, error: { message: 'delete requires .eq("id", ...)' }, count: null };
      const res = await apiFetch<any>(`/${this.table}/${id}`, { method: 'DELETE' });
      return { data: res.data, error: res.error, count: null };
    }
    return { data: null, error: { ...READONLY_ERROR }, count: null };
  }

  private run() {
    return this.mode === 'select' ? this.runSelect() : this.runWrite();
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

// ---------- Storage (POST /api/uploads) ----------
function bucketToCategory(bucket: string): string {
  switch (bucket) {
    case 'wrestler-media': return 'wrestlers';
    case 'album-media': return 'albums';
    case 'building-media': return 'buildings';
    case 'museum-audio': return 'audio';
    default: return 'wrestlers';
  }
}

const storageBucket = (bucket: string) => ({
  upload: async (path: string, file: Blob | File) => {
    const fd = new FormData();
    const name = (file as any)?.name || path;
    fd.append('file', file as any, name);
    fd.append('category', bucketToCategory(bucket));
    fd.append('path', path);
    const res = await apiFetch<{ url: string }>(`/uploads`, { method: 'POST', body: fd });
    if (res.error) return { data: null, error: res.error };
    return { data: { path: res.data!.url }, error: null };
  },
  uploadToSignedUrl: async () => ({ data: null, error: { ...READONLY_ERROR } }),
  download: async () => ({ data: null, error: { ...READONLY_ERROR } }),
  remove: async () => ({ data: null, error: { ...READONLY_ERROR } }),
  list: async () => ({ data: [], error: null }),
  getPublicUrl: (path: string) => ({
    data: {
      publicUrl:
        path?.startsWith('http') || path?.startsWith('/')
          ? path
          : `/uploads/${bucketToCategory(bucket)}/${path}`,
    },
  }),
  createSignedUrl: async (path: string) => ({
    data: { signedUrl: path?.startsWith('/') ? path : `/uploads/${bucketToCategory(bucket)}/${path}` },
    error: null,
  }),
  createSignedUploadUrl: async () => ({ data: null, error: { ...READONLY_ERROR } }),
  move: async () => ({ data: null, error: { ...READONLY_ERROR } }),
  copy: async () => ({ data: null, error: { ...READONLY_ERROR } }),
});

// ---------- Auth (JWT) ----------
type AuthListener = (event: string, session: any) => void;
const authListeners = new Set<AuthListener>();
let currentSession: any = null;

async function refreshCurrentUser() {
  const token = getToken();
  if (!token) { currentSession = null; return; }
  const res = await apiFetch<{ user: any }>(`/auth/me`);
  if (res.error) { currentSession = null; setToken(null); return; }
  currentSession = { access_token: token, user: res.data!.user };
}

if (typeof window !== 'undefined') void refreshCurrentUser();

function emitAuth(event: string) {
  for (const cb of authListeners) {
    try { cb(event, currentSession); } catch { /* ignore */ }
  }
}

const authStub = {
  getSession: async () => {
    if (!currentSession && getToken()) await refreshCurrentUser();
    return { data: { session: currentSession }, error: null };
  },
  getUser: async () => {
    if (!currentSession && getToken()) await refreshCurrentUser();
    return { data: { user: currentSession?.user ?? null }, error: null };
  },
  signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
    const res = await apiFetch<{ token: string; user: any }>(`/auth/login`, {
      method: 'POST', body: JSON.stringify({ email, password }),
    });
    if (res.error) return { data: { user: null, session: null }, error: res.error };
    setToken(res.data!.token);
    currentSession = { access_token: res.data!.token, user: res.data!.user };
    emitAuth('SIGNED_IN');
    return { data: { user: res.data!.user, session: currentSession }, error: null };
  },
  signUp: async ({ email, password }: { email: string; password: string }) => {
    // First-time admin setup path.
    const res = await apiFetch<{ token: string; user: any }>(`/auth/setup`, {
      method: 'POST', body: JSON.stringify({ email, password }),
    });
    if (res.error) return { data: { user: null, session: null }, error: res.error };
    setToken(res.data!.token);
    currentSession = { access_token: res.data!.token, user: res.data!.user };
    emitAuth('SIGNED_IN');
    return { data: { user: res.data!.user, session: currentSession }, error: null };
  },
  signOut: async () => {
    setToken(null); currentSession = null; emitAuth('SIGNED_OUT');
    return { error: null };
  },
  resetPasswordForEmail: async () => ({ data: null, error: { message: 'Password reset not supported offline.' } }),
  updateUser: async () => ({ data: { user: null }, error: { ...READONLY_ERROR } }),
  onAuthStateChange: (cb: AuthListener) => {
    authListeners.add(cb);
    queueMicrotask(() => cb(currentSession ? 'SIGNED_IN' : 'SIGNED_OUT', currentSession));
    return { data: { subscription: { unsubscribe: () => authListeners.delete(cb) } } };
  },
  setSession: async () => ({ data: { session: currentSession }, error: null }),
  refreshSession: async () => {
    await refreshCurrentUser();
    return { data: { session: currentSession }, error: null };
  },
};

// ---------- Functions (AI proxy) ----------
const functionsStub = {
  invoke: async (name: string, opts?: { body?: any }) => {
    if (name === 'museum-assistant') {
      const res = await apiFetch<any>(`/ai/chat`, {
        method: 'POST', body: JSON.stringify(opts?.body ?? {}),
      });
      return { data: res.data, error: res.error };
    }
    return { data: null, error: { message: `Function "${name}" not available.` } };
  },
};

// ---------- Realtime stub (no-op) ----------
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

export const supabaseUrl = '';

export const testConnection = async (): Promise<boolean> => {
  const res = await apiFetch(`/snapshot.json`);
  return !res.error;
};

export async function fetchWithRetry<T>(fetchFn: () => Promise<T>): Promise<T> {
  return fetchFn();
}

export async function healthCheck(): Promise<{
  status: 'healthy' | 'degraded' | 'offline';
  latency: number;
}> {
  const t0 = Date.now();
  const res = await apiFetch(`/snapshot.json`);
  const latency = Date.now() - t0;
  if (res.error) return { status: 'offline', latency };
  if (latency > 3000) return { status: 'degraded', latency };
  return { status: 'healthy', latency };
}