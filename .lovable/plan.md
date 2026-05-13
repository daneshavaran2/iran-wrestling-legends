# Offline-First Refactor Plan

Make the app start instantly from a committed local bundle, never require Supabase at build time, and only sync in the background when online.

## 1. Repository Bundle (committed assets)

```
public/
  data/snapshot.json     ← committed, source of truth at startup
  videos/*.mp4           ← committed, referenced by /videos/<file>
  videos/manifest.json   ← committed (url → /videos/<file>)
```

- Remove `public/data/.gitkeep` and `public/videos/.gitkeep` from `.gitignore` exclusions so the JSON + mp4 files are tracked.
- Update `.gitignore` to **track** `public/data/snapshot.json`, `public/videos/*.mp4`, and `public/videos/manifest.json`.

## 2. Refactor `scripts/bundle-content.mjs` (developer-only)

Keep its current resilience (atomic writes, preserve previous on failure, HEAD-size skip, orphan cleanup) and add:

- **URL rewrite**: when a video URL is successfully downloaded, rewrite that URL inline inside the snapshot tables (`wrestlers.intro_video_url`, `wrestler_media.url`, `history_media.url`, `about_media.url` where `type='video'`) to `/videos/<hash>.<ext>`. Keep a `__remoteUrl` sibling field for optional later background refresh.
- **Image bundling (optional, same pattern)**: behind `--with-images` flag, do the same for image URLs into `public/media/`. Default off to keep PR small; videos are the priority.
- **Safety**: if zero tables succeed AND no previous snapshot exists, exit 0 without writing. Never overwrite a good snapshot with an empty one (already partially done — strengthen).
- **Logging**: keep colored summary `(d=… u=… s=… r=… f=…)`.
- Script remains idempotent and **only run by developers locally** via `npm run sync:content`.

## 3. Remove CI dependency on Supabase

`package.json`:
- Remove `prebuild` hook (or replace with `"prebuild": "echo 'Using committed offline bundle'"`).
- Keep manual scripts: `sync:content`, `bundle:content` → `node scripts/bundle-content.mjs`.
- `build` becomes plain `vite build`.

Result: CI/Liara builds need zero Supabase env vars.

## 4. Runtime data strategy

`src/lib/contentSnapshot.ts`:
- On import, immediately `fetch('/data/snapshot.json')` (already done) — this is **Priority 1**, synchronous-feeling, no Supabase call.
- Expose `getTable<T>(name)` returning local data.

`src/contexts/WrestlerContext.tsx` and `src/contexts/OfflineDataContext.tsx`:
- **Priority 1**: seed state from `loadSnapshot()` and set `isLoading=false` immediately (already done).
- **Priority 2**: only if `navigator.onLine`, kick off a background Supabase fetch after a short delay (e.g., 1500 ms) and merge results into state. Wrap in try/catch — failure is silent.
- **Priority 3**: on Supabase error, do nothing — UI keeps showing snapshot.
- Remove any code path that blocks render on Supabase.

## 5. Video resolver

`src/lib/bundledVideos.ts` (already exists with probe + remote fallback):
- Add a helper `toLocalIfRewritten(url)` — if URL already starts with `/videos/`, return as-is.
- Keep the manifest lookup + probe + remote fallback for any URL still pointing to Supabase (e.g., new content fetched in background sync).

## 6. Service worker (`public/sw.js`)

Update precache list and runtime caching:
- **Precache** on install: `/`, `/index.html`, `/data/snapshot.json`, `/videos/manifest.json`.
- **CacheFirst** for `/videos/*.mp4` (long-lived, immutable bundle).
- **StaleWhileRevalidate** for `/data/snapshot.json` (so updated bundle on redeploy is picked up).
- **NetworkFirst** for navigations (existing pattern).
- Bump `CACHE_VERSION` so old SW reloads.

## 7. Video optimization (developer doc)

Add a short section to `KIOSK_README.md` (or new `scripts/README.md`) documenting:
```
ffmpeg -i input.mov -vcodec libx264 -crf 28 -preset slow -movflags +faststart output.mp4
```
Recommend running this before uploading to Supabase so bundled files stay small.

## 8. Developer workflow

```text
Developer:
  1. edit content in admin (Supabase)
  2. npm run sync:content   ← downloads snapshot + videos, rewrites URLs
  3. git add public/data public/videos && commit
  4. push → CI builds with `vite build` only (no Supabase)
End user:
  - opens app → instant render from snapshot.json
  - online?  → background sync merges fresh data silently
  - offline? → fully functional, videos play from /videos/*.mp4
```

## Files to change

- `package.json` — remove `prebuild`, keep manual sync scripts
- `.gitignore` — track `public/data/*.json`, `public/videos/*.mp4`, `public/videos/manifest.json`
- `scripts/bundle-content.mjs` — add URL rewrite into snapshot, strengthen safety
- `src/lib/contentSnapshot.ts` — no change needed beyond what's there (Priority 1 already)
- `src/contexts/WrestlerContext.tsx` — gate Supabase refresh on `navigator.onLine`, defer, never block UI
- `src/contexts/OfflineDataContext.tsx` — same pattern
- `src/lib/bundledVideos.ts` — handle already-local `/videos/...` URLs
- `public/sw.js` — precache snapshot + manifest, CacheFirst videos, bump version
- `KIOSK_README.md` — document `sync:content` workflow + ffmpeg recipe
- `scripts/bundle-videos.mjs` — delete (superseded)

## Out of scope

- Image bundling (kept as optional flag, default off)
- Admin panel changes — still talks to Supabase directly
- Auth flow — unchanged
