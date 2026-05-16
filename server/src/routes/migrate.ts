import type { FastifyInstance, FastifyRequest } from 'fastify';
import { db, PUBLIC_TABLES, type TableName } from '../db.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

// Columns that should be stored as INTEGER 0/1 in SQLite.
const BOOL_COLS = new Set([
  'is_visible',
  'bg_music_autoplay',
  'bg_music_enabled',
]);

function coerceRow(row: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v === null || v === undefined) { out[k] = null; continue; }
    if (BOOL_COLS.has(k) && typeof v === 'boolean') { out[k] = v ? 1 : 0; continue; }
    if (typeof v === 'boolean') { out[k] = v ? 1 : 0; continue; }
    if (typeof v === 'object') { out[k] = JSON.stringify(v); continue; }
    out[k] = v;
  }
  return out;
}

function getTableColumns(table: string): Set<string> {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  return new Set(rows.map((r) => r.name));
}

async function fetchTable(supabaseUrl: string, anonKey: string, table: string) {
  const url = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/${table}?select=*`;
  const res = await fetch(url, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Supabase ${table} ${res.status}: ${text.slice(0, 200)}`);
  }
  return (await res.json()) as Array<Record<string, any>>;
}

function importRows(table: string, rows: Array<Record<string, any>>): number {
  if (!rows.length) return 0;
  const allowed = getTableColumns(table);
  const tx = db.transaction((items: Array<Record<string, any>>) => {
    let n = 0;
    for (const raw of items) {
      const row = coerceRow(raw);
      const cols = Object.keys(row).filter((c) => allowed.has(c));
      if (!cols.length) continue;
      const placeholders = cols.map(() => '?').join(', ');
      const sql = `INSERT OR REPLACE INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`;
      const values = cols.map((c) => row[c]);
      db.prepare(sql).run(...values);
      n++;
    }
    return n;
  });
  return tx(rows);
}

export default async function migrateRoutes(app: FastifyInstance) {
  app.post(
    '/admin/migrate-from-supabase',
    { preHandler: requireAdmin },
    async (
      req: FastifyRequest<{ Body: { supabaseUrl?: string; anonKey?: string; tables?: string[] } }>,
      reply,
    ) => {
      const { supabaseUrl, anonKey, tables } = req.body || {};
      if (!supabaseUrl || !anonKey) {
        return reply.code(400).send({ data: null, error: { message: 'supabaseUrl and anonKey are required' } });
      }
      const targets: TableName[] = (tables && tables.length
        ? tables.filter((t) => (PUBLIC_TABLES as readonly string[]).includes(t))
        : (PUBLIC_TABLES as readonly string[])) as TableName[];

      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      const send = (event: string, data: any) => {
        reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      };

      let total = 0;
      for (const table of targets) {
        send('table_start', { table });
        try {
          const rows = await fetchTable(supabaseUrl, anonKey, table);
          const inserted = importRows(table, rows);
          total += inserted;
          send('table_done', { table, count: inserted, ok: true });
        } catch (err: any) {
          send('table_done', { table, ok: false, error: String(err?.message || err) });
        }
      }
      send('done', { total });
      reply.raw.end();
    },
  );
}
