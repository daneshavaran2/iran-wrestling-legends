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
const probeCache = new Map<string, boolean>(); // localPath -> exists

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

/**
 * Synchronous resolver — safe for direct use in JSX `src` props.
 * If the manifest hasn't loaded yet on first paint, it returns the remote
 * URL; the next render will pick up the local copy.
 */
export function resolveBundledVideo(url: string | null | undefined): string {
  if (!url) return '';
  const local = lookup(url);
  if (!local) return url;
  // Optimistically return local; probe in background to invalidate if missing
  if (probeCache.get(local) === false) return url;
  if (probeCache.get(local) === undefined) {
    probeCache.set(local, true); // assume present
    void fetch(local, { method: 'HEAD' })
      .then((r) => probeCache.set(local, r.ok))
      .catch(() => probeCache.set(local, false));
  }
  return local;
}

export async function resolveBundledVideoAsync(url: string | null | undefined): Promise<string> {
  if (!url) return '';
  await loadManifest();
  const local = lookup(url);
  if (!local) return url;
  if (probeCache.has(local)) return probeCache.get(local) ? local : url;
  try {
    const r = await fetch(local, { method: 'HEAD' });
    probeCache.set(local, r.ok);
    return r.ok ? local : url;
  } catch {
    probeCache.set(local, false);
    return url;
  }
}

export { loadManifest as preloadVideoManifest };
