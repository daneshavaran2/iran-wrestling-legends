/**
 * Resolves a remote (Supabase) video URL to a locally bundled /videos/<file>
 * URL when one exists. The manifest is generated at build time by
 * scripts/bundle-videos.mjs and shipped as a static asset, so the lookup
 * works even when the network or Supabase is fully unreachable.
 */

let manifestCache: Record<string, string> | null = null;
let manifestPromise: Promise<Record<string, string>> | null = null;

async function loadManifest(): Promise<Record<string, string>> {
  if (manifestCache) return manifestCache;
  if (manifestPromise) return manifestPromise;
  manifestPromise = fetch('/videos/manifest.json', { cache: 'force-cache' })
    .then((r) => (r.ok ? r.json() : {}))
    .catch(() => ({}))
    .then((m) => {
      manifestCache = m || {};
      return manifestCache;
    });
  return manifestPromise;
}

// Kick off load eagerly so the manifest is ready before the first video tag.
if (typeof window !== 'undefined') {
  void loadManifest();
}

function lookupSync(url: string): string | null {
  if (!manifestCache || !url) return null;
  if (manifestCache[url]) return manifestCache[url];
  // Try without query string
  const bare = url.split('?')[0];
  if (manifestCache[bare]) return manifestCache[bare];
  // Try matching ignoring query strings on either side
  for (const key of Object.keys(manifestCache)) {
    if (key.split('?')[0] === bare) return manifestCache[key];
  }
  return null;
}

export function resolveBundledVideo(url: string | null | undefined): string {
  if (!url) return '';
  const local = lookupSync(url);
  return local || url;
}

export async function resolveBundledVideoAsync(url: string | null | undefined): Promise<string> {
  if (!url) return '';
  await loadManifest();
  return lookupSync(url) || url;
}

export { loadManifest as preloadVideoManifest };