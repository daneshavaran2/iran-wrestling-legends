/**
 * Local-first video resolver.
 *
 * Reads /videos/manifest.json (generated at build time by
 * scripts/bundle-videos.mjs) and swaps remote Supabase URLs for locally
 * bundled /videos/<file> paths. Falls back to the original remote URL when
 * the local file is missing for any reason.
 */

type ManifestMap = Record<string, string>;
type ManifestPayload = ManifestMap | { videos?: ManifestMap };

let manifestCache: ManifestMap | null = null;
let manifestPromise: Promise<ManifestMap> | null = null;
// localPath -> verified existence. Only `true` once HEAD/GET succeeds.
const probeCache = new Map<string, boolean>();
const probeInflight = new Map<string, Promise<boolean>>();
// remote URLs that proved bad locally — never try local again this session
const blacklistedRemote = new Set<string>();

function normalizeManifest(raw: ManifestPayload | null | undefined): ManifestMap {
  if (!raw) return {};
  if (typeof raw === 'object' && 'videos' in raw && raw.videos && typeof raw.videos === 'object') {
    return raw.videos as ManifestMap;
  }
  return raw as ManifestMap;
}

async function loadManifest(): Promise<ManifestMap> {
  if (manifestCache) return manifestCache;
  if (manifestPromise) return manifestPromise;
  manifestPromise = fetch('/videos/manifest.json', { cache: 'no-cache' })
    .then((r) => (r.ok ? r.json() : {}))
    .catch(() => ({}))
    .then((m: ManifestPayload) => {
      manifestCache = normalizeManifest(m);
      return manifestCache;
    });
  return manifestPromise;
}

if (typeof window !== 'undefined') {
  void loadManifest();
}

function lookup(url: string): string | null {
  if (!manifestCache || !url) return null;
  if (manifestCache[url]) return manifestCache[url];
  const bare = url.split('?')[0];
  if (manifestCache[bare]) return manifestCache[bare];
  for (const key of Object.keys(manifestCache)) {
    if (key.split('?')[0] === bare) return manifestCache[key];
  }
  return null;
}

function probe(localPath: string): Promise<boolean> {
  const cached = probeCache.get(localPath);
  if (cached !== undefined) return Promise.resolve(cached);
  const existing = probeInflight.get(localPath);
  if (existing) return existing;
  const p = fetch(localPath, { method: 'GET', headers: { Range: 'bytes=0-0' } })
    .then((r) => {
      const ok = r.ok || r.status === 206;
      probeCache.set(localPath, ok);
      return ok;
    })
    .catch(() => {
      probeCache.set(localPath, false);
      return false;
    })
    .finally(() => probeInflight.delete(localPath));
  probeInflight.set(localPath, p);
  return p;
}

/**
 * Synchronous resolver — safe for direct use in JSX `src` props.
 *
 * Conservative: only returns the local path when the file has been verified
 * to exist this session. Otherwise returns the remote URL (which always
 * works) and kicks off a background probe so future renders can upgrade.
 */
export function resolveBundledVideo(url: string | null | undefined): string {
  if (!url) return '';
  // Already a local bundled path — return as-is, browser/SW will serve it.
  if (url.startsWith('/videos/')) return url;
  if (blacklistedRemote.has(url)) return url;
  const local = lookup(url);
  if (!local) return url;
  if (probeCache.get(local) === true) return local;
  // Not verified yet — return remote now, probe in background
  if (probeCache.get(local) === undefined) void probe(local);
  return url;
}

export async function resolveBundledVideoAsync(url: string | null | undefined): Promise<string> {
  if (!url) return '';
  if (url.startsWith('/videos/')) return url;
  if (blacklistedRemote.has(url)) return url;
  await loadManifest();
  const local = lookup(url);
  if (!local) return url;
  const ok = await probe(local);
  return ok ? local : url;
}

/**
 * Mark a remote URL's local copy as bad (e.g. video element raised an error
 * while playing the local file). Future resolves will return the remote URL.
 */
export function markBundledVideoBroken(remoteUrl: string | null | undefined) {
  if (!remoteUrl) return;
  blacklistedRemote.add(remoteUrl);
  const local = lookup(remoteUrl);
  if (local) probeCache.set(local, false);
}

export { loadManifest as preloadVideoManifest };
