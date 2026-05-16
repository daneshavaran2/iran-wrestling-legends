import { randomBytes } from 'node:crypto';

export const PORT = Number(process.env.PORT || 3001);
export const HOST = process.env.HOST || '0.0.0.0';
export const DATA_DIR = process.env.DATA_DIR || './data';
export const DB_PATH = process.env.DB_PATH || `${DATA_DIR}/db.sqlite`;
export const UPLOADS_DIR = `${DATA_DIR}/uploads`;

export const JWT_SECRET =
  process.env.JWT_SECRET ||
  (process.env.NODE_ENV === 'production'
    ? (() => {
        throw new Error('JWT_SECRET env var is required in production');
      })()
    : randomBytes(32).toString('hex'));

export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const CORS_ORIGIN = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map((s) => s.trim());

export const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY || '';

// Open admin mode — when true, all admin-only endpoints accept requests without a JWT.
// Intended for closed local kiosks behind nginx. Defaults to true to keep deployment simple.
export const OPEN_ADMIN =
  (process.env.OPEN_ADMIN ?? 'true').toLowerCase() !== 'false';