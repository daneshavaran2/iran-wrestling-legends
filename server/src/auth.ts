import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_EXPIRES_IN, JWT_SECRET } from './env.js';
import { db } from './db.js';
import { randomUUID } from 'node:crypto';

export interface JwtPayload {
  sub: string;
  email: string;
  role: 'admin' | 'user';
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export async function createUser(email: string, password: string, role: 'admin' | 'user' = 'admin') {
  const id = randomUUID();
  const password_hash = await bcrypt.hash(password, 12);
  db.prepare(
    `INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)`,
  ).run(id, email.toLowerCase(), password_hash, role);
  return { id, email, role };
}

export async function verifyPassword(email: string, password: string) {
  const row = db
    .prepare(`SELECT id, email, password_hash, role FROM users WHERE email = ?`)
    .get(email.toLowerCase()) as any;
  if (!row) return null;
  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) return null;
  return { id: row.id, email: row.email, role: row.role as 'admin' | 'user' };
}

export function adminExists(): boolean {
  const row = db.prepare(`SELECT 1 FROM users WHERE role = 'admin' LIMIT 1`).get();
  return !!row;
}