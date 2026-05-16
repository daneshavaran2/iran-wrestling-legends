/**
 * Minimal HTTP client for the Node.js backend (Fastify + SQLite).
 * Centralises base URL, JWT header, and `{ data, error }` unwrapping.
 */

const RAW_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '/api';

export const API_BASE = RAW_BASE.replace(/\/$/, '');

const TOKEN_KEY = 'museum_auth_token';

export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch { /* noop */ }
}

export interface ApiResult<T> {
  data: T | null;
  error: { message: string; code?: string } | null;
  status: number;
}

export async function apiFetch<T = any>(
  path: string,
  init: RequestInit = {},
): Promise<ApiResult<T>> {
  const headers = new Headers(init.headers || {});
  if (!headers.has('Content-Type') && init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  try {
    const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
    const text = await res.text();
    let body: any = null;
    if (text) {
      try { body = JSON.parse(text); } catch { body = { data: text, error: null }; }
    }
    if (!res.ok) {
      return {
        data: null,
        error: body?.error || { message: `HTTP ${res.status}` },
        status: res.status,
      };
    }
    return { data: body?.data ?? null, error: body?.error ?? null, status: res.status };
  } catch (err: any) {
    return { data: null, error: { message: err?.message || 'Network error', code: 'NETWORK' }, status: 0 };
  }
}

export function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v == null) continue;
    sp.append(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}