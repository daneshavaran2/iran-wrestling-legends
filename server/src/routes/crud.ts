import type { FastifyInstance, FastifyRequest } from 'fastify';
import { randomUUID } from 'node:crypto';
import { db, PUBLIC_TABLES, type TableName } from '../db.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const OPS = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'in', 'is'] as const;
type Op = (typeof OPS)[number];

function buildSelect(table: string, query: Record<string, any>) {
  const where: string[] = [];
  const params: any[] = [];
  const orderBy: string[] = [];
  let limit: number | null = null;
  let offset = 0;

  for (const [key, raw] of Object.entries(query)) {
    if (raw == null) continue;
    const val = String(raw);
    if (key === 'order') {
      // order=col.asc or col.desc (repeatable: order=a.asc,b.desc)
      for (const part of val.split(',')) {
        const [col, dir] = part.split('.');
        if (!/^[a-zA-Z0-9_]+$/.test(col)) continue;
        orderBy.push(`${col} ${dir === 'desc' ? 'DESC' : 'ASC'}`);
      }
      continue;
    }
    if (key === 'limit') { limit = Math.max(0, parseInt(val, 10) || 0); continue; }
    if (key === 'offset') { offset = Math.max(0, parseInt(val, 10) || 0); continue; }
    // pattern: <col>.<op>=<value>  (encoded as key="<col>.<op>")
    const m = key.match(/^([a-zA-Z0-9_]+)\.([a-z]+)$/);
    if (!m) continue;
    const col = m[1];
    const op = m[2] as Op;
    if (!OPS.includes(op)) continue;
    switch (op) {
      case 'eq': where.push(`${col} = ?`); params.push(coerce(val)); break;
      case 'neq': where.push(`${col} != ?`); params.push(coerce(val)); break;
      case 'gt': where.push(`${col} > ?`); params.push(coerce(val)); break;
      case 'gte': where.push(`${col} >= ?`); params.push(coerce(val)); break;
      case 'lt': where.push(`${col} < ?`); params.push(coerce(val)); break;
      case 'lte': where.push(`${col} <= ?`); params.push(coerce(val)); break;
      case 'like': where.push(`${col} LIKE ?`); params.push(val); break;
      case 'ilike': where.push(`LOWER(${col}) LIKE LOWER(?)`); params.push(val); break;
      case 'is':
        if (val === 'null') where.push(`${col} IS NULL`);
        else if (val === 'true') { where.push(`${col} = 1`); }
        else if (val === 'false') { where.push(`${col} = 0`); }
        else { where.push(`${col} = ?`); params.push(coerce(val)); }
        break;
      case 'in': {
        const items = val.split(',');
        where.push(`${col} IN (${items.map(() => '?').join(',')})`);
        params.push(...items.map(coerce));
        break;
      }
    }
  }

  let sql = `SELECT * FROM ${table}`;
  if (where.length) sql += ` WHERE ${where.join(' AND ')}`;
  if (orderBy.length) sql += ` ORDER BY ${orderBy.join(', ')}`;
  if (limit != null) sql += ` LIMIT ${limit} OFFSET ${offset}`;
  return { sql, params };
}

function coerce(v: string): any {
  if (v === 'true') return 1;
  if (v === 'false') return 0;
  if (v === 'null') return null;
  if (/^-?\d+$/.test(v)) return parseInt(v, 10);
  if (/^-?\d+\.\d+$/.test(v)) return parseFloat(v);
  return v;
}

function normalizeBooleans(row: any): any {
  if (!row) return row;
  // common bool columns; pass through everything else
  const boolKeys = ['is_visible', 'bg_music_enabled', 'bg_music_autoplay'];
  for (const k of boolKeys) if (k in row) row[k] = !!row[k];
  return row;
}

function rowToOutput(row: any) {
  return normalizeBooleans(row);
}

function insertRow(table: string, body: any) {
  const data = { ...body };
  if (!data.id) data.id = randomUUID();
  const now = new Date().toISOString();
  if (!data.created_at) data.created_at = now;
  if ('updated_at' in tableColumns(table)) data.updated_at = now;
  // boolean → int
  for (const [k, v] of Object.entries(data)) {
    if (typeof v === 'boolean') data[k] = v ? 1 : 0;
  }
  const cols = Object.keys(data).filter((c) => c in tableColumns(table));
  const placeholders = cols.map(() => '?').join(',');
  const params = cols.map((c) => (data as any)[c]);
  db.prepare(`INSERT INTO ${table} (${cols.join(',')}) VALUES (${placeholders})`).run(...params);
  return db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(data.id);
}

function updateRow(table: string, id: string, body: any) {
  const data = { ...body };
  delete data.id;
  if ('updated_at' in tableColumns(table)) data.updated_at = new Date().toISOString();
  for (const [k, v] of Object.entries(data)) {
    if (typeof v === 'boolean') data[k] = v ? 1 : 0;
  }
  const cols = Object.keys(data).filter((c) => c in tableColumns(table));
  if (cols.length === 0) return db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
  const set = cols.map((c) => `${c} = ?`).join(',');
  const params = cols.map((c) => (data as any)[c]);
  db.prepare(`UPDATE ${table} SET ${set} WHERE id = ?`).run(...params, id);
  return db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
}

const colCache = new Map<string, Record<string, true>>();
function tableColumns(table: string): Record<string, true> {
  let c = colCache.get(table);
  if (c) return c;
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
  c = {};
  for (const r of rows) c[r.name] = true;
  colCache.set(table, c);
  return c;
}

export default async function crudRoutes(app: FastifyInstance) {
  for (const table of PUBLIC_TABLES) {
    // LIST
    app.get(`/${table}`, async (req) => {
      const { sql, params } = buildSelect(table, (req.query || {}) as any);
      const rows = db.prepare(sql).all(...params) as any[];
      return { data: rows.map(rowToOutput), error: null };
    });

    // GET by id
    app.get(`/${table}/:id`, async (req, reply) => {
      const { id } = req.params as { id: string };
      const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
      if (!row) return reply.code(404).send({ data: null, error: { message: 'Not found' } });
      return { data: rowToOutput(row), error: null };
    });

    // INSERT (admin)
    app.post(`/${table}`, { preHandler: requireAdmin }, async (req) => {
      const body = req.body as any;
      if (Array.isArray(body)) {
        const rows = body.map((b) => rowToOutput(insertRow(table, b)));
        return { data: rows, error: null };
      }
      return { data: rowToOutput(insertRow(table, body || {})), error: null };
    });

    // UPDATE (admin)
    app.patch(`/${table}/:id`, { preHandler: requireAdmin }, async (req, reply) => {
      const { id } = req.params as { id: string };
      const exists = db.prepare(`SELECT 1 FROM ${table} WHERE id = ?`).get(id);
      if (!exists) return reply.code(404).send({ data: null, error: { message: 'Not found' } });
      return { data: rowToOutput(updateRow(table, id, req.body || {})), error: null };
    });

    // UPSERT (admin) — convenience
    app.put(`/${table}/:id`, { preHandler: requireAdmin }, async (req) => {
      const { id } = req.params as { id: string };
      const body = { ...(req.body as any), id };
      const exists = db.prepare(`SELECT 1 FROM ${table} WHERE id = ?`).get(id);
      const row = exists ? updateRow(table, id, body) : insertRow(table, body);
      return { data: rowToOutput(row), error: null };
    });

    // DELETE (admin)
    app.delete(`/${table}/:id`, { preHandler: requireAdmin }, async (req) => {
      const { id } = req.params as { id: string };
      db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
      return { data: { id }, error: null };
    });
  }

  // Snapshot — all public tables in one shot for offline cache.
  app.get('/snapshot.json', async () => {
    const tables: Record<string, any[]> = {};
    for (const t of PUBLIC_TABLES) {
      const rows = db.prepare(`SELECT * FROM ${t}`).all() as any[];
      tables[t] = rows.map(rowToOutput);
    }
    return {
      generatedAt: new Date().toISOString(),
      version: Date.now(),
      tables,
    };
  });
}

export { buildSelect };
export type { FastifyRequest };