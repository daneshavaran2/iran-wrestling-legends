/**
 * Runtime mode flags.
 *
 * `offlineOnly` = true means the app must NEVER attempt to reach Supabase
 * (or any external network) at runtime. All content is served from the
 * build-time snapshot (`/data/snapshot.json`) and bundled `/images/*`,
 * `/videos/*` files. This is the default for kiosks deployed to networks
 * without international internet access.
 *
 * Toggle at runtime by setting `localStorage.offlineOnly = "false"` (or
 * `"true"`) and reloading. Build-time override via
 * `VITE_OFFLINE_ONLY=false` environment variable.
 */

const STORAGE_KEY = 'offlineOnly';

function readEnvDefault(): boolean {
  // Default to TRUE — kiosks ship without international connectivity.
  const env = (import.meta as any)?.env?.VITE_OFFLINE_ONLY;
  if (env === 'false' || env === false) return false;
  if (env === 'true' || env === true) return true;
  return true;
}

export function isOfflineOnly(): boolean {
  if (typeof window === 'undefined') return readEnvDefault();
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v === 'true') return true;
    if (v === 'false') return false;
  } catch {}
  return readEnvDefault();
}

export function setOfflineOnly(value: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false');
  } catch {}
}

/**
 * Returns true only when we're allowed AND able to reach the network.
 * Use to gate any optional Supabase/edge-function call.
 */
export function canUseNetwork(): boolean {
  if (isOfflineOnly()) return false;
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine !== false;
}

/** Run a network-bound async fn with a hard timeout, falling back safely. */
export async function safeNetworkCall<T>(
  fn: () => Promise<T>,
  fallback: T,
  timeoutMs = 2500,
): Promise<T> {
  if (!canUseNetwork()) return fallback;
  try {
    return await Promise.race<T>([
      fn(),
      new Promise<T>((resolve) => setTimeout(() => resolve(fallback), timeoutMs)),
    ]);
  } catch {
    return fallback;
  }
}