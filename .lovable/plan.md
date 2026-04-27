# Plan: Full Offline Support for the Entire App

## Goal
The app should work **completely without internet** after the first online visit (or after one "Download Everything" run from the admin panel). All wrestlers, all detail pages (history, buildings, albums), all images, and all routes must load from cache when offline.

---

## Current Gaps Identified

| Area | Status | Problem |
|------|--------|---------|
| Wrestlers list + profiles | ✅ Cached (localStorage + SW) | OK |
| History list (top-level) | ✅ Cached | OK |
| Buildings list | ✅ Cached | OK |
| Albums list | ✅ Cached | OK |
| **History detail pages** (`/history/:slug`) | ❌ Direct Supabase calls, no cache | Breaks offline |
| **Building detail pages** (`/buildings/:id`) | ❌ Direct Supabase calls, no cache | Breaks offline |
| **Album gallery pages** (`/albums/:id`) | ❌ Direct Supabase calls, no cache | Breaks offline |
| **Child history sections + media** | ❌ Not pre-fetched | Breaks offline |
| **Building images, album photos** | ❌ Not pre-fetched as data | Breaks offline |
| **SPA routes** (e.g. `/wrestlers/abc`) | ⚠️ SW falls back to `/` but data missing | Blank page offline |
| Service Worker API caching | ⚠️ "Stale-While-Revalidate" returns 503 if first visit is offline | Need offline-first fallback |

---

## Implementation

### 1. Extend `OfflineDataContext` to cache deep data
Add caches and refresh functions for the entities currently fetched only inside detail pages:
- `historyMedia` (all rows of `history_media`)
- `historyChildren` (all rows of `history_sections` including child sections)
- `buildingImages` (all rows of `building_images`)
- `albumPhotos` (all rows of `album_photos`)

Expose helpers:
- `getHistorySection(slug)`, `getHistoryChildren(parentId)`, `getHistoryMedia(sectionId)`
- `getBuildingById(id)`, `getBuildingImages(buildingId)`
- `getAlbumById(id)`, `getAlbumPhotos(albumId)`

All read from in-memory state (hydrated from `localStorage` on mount), with online refresh in background.

### 2. Refactor detail pages to use the context (no direct Supabase)
- `src/pages/HistoryDetailPage.tsx` → use `useOfflineData()` instead of `supabase.from('history_sections')`/`history_media`.
- `src/pages/BuildingDetailPage.tsx` → use `useOfflineData()` instead of `supabase.from('buildings')`/`building_images`.
- `src/pages/AlbumGalleryPage.tsx` → use `useOfflineData()` instead of `supabase.from('albums')`/`album_photos`.

This guarantees they render from cache when offline and never throw a network error.

### 3. Strengthen the Service Worker (`public/sw.js`)
- **API requests**: switch to **Cache-First with background revalidate** for Supabase GET requests so the very first offline load also works (currently only SWR — returns 503 if cache miss).
- **Add new endpoints to `SYNC_ENDPOINTS`**: `history_media`, `building_images`, `album_photos` (already partial), so background sync covers them.
- **Pre-cache all SPA routes** during install so deep links work offline:
  ```
  /, /wrestlers, /history, /buildings, /albums, /books, /about, /install
  ```
- **Navigation fallback**: when offline and the requested route isn't cached, serve cached `/index.html` so the SPA router can render the page from in-memory data (already partially done, will be made robust).
- Bump `CACHE_VERSION` to `v5` to force refresh.

### 4. Improve "Download All for Offline" in the admin panel
The existing `useOfflineDownload` hook already downloads images. We will:
- Ensure it **also writes the deep API responses** (history_media, building_images, album_photos) into the SW's `API_CACHE` via `CACHE_URLS` postMessage.
- Add a new postMessage type `CACHE_API_URLS` in the SW that fetches+stores Supabase REST URLs (with auth headers) in `API_CACHE`.
- Show a "✅ App is fully available offline" indicator when download completes.

### 5. Add an Offline-Ready badge
Small UI indicator on the home page footer: green dot + "آماده برای استفاده آفلاین" when all caches are populated, otherwise "برای آفلاین، یک‌بار همه چیز را دانلود کنید" with a link to `/admin/offline`.

---

## Technical Details

### Files to modify
- `src/contexts/OfflineDataContext.tsx` — add new caches + getters
- `src/pages/HistoryDetailPage.tsx` — switch to context
- `src/pages/BuildingDetailPage.tsx` — switch to context
- `src/pages/AlbumGalleryPage.tsx` — switch to context
- `public/sw.js` — cache-first for API, pre-cache SPA routes, bump version, add `CACHE_API_URLS` handler
- `src/hooks/useOfflineDownload.ts` — also pre-cache deep API URLs
- `src/components/OfflineIndicator.tsx` — add "ready for offline" status
- `src/locales/{fa,en,ar}.json` — new translation keys for the offline-ready badge

### Cache strategy summary after changes
| Resource | Strategy |
|---|---|
| HTML / SPA routes | Pre-cached on install + Network-First with `/index.html` fallback |
| Supabase REST GET | **Cache-First** + background revalidate |
| Images | Cache-First (already) |
| Fonts / static | Cache-First (already) |

### Result
- After the user visits the app online once (or runs "Download All"), the **entire app — every wrestler, every history page, every building, every album photo, every image — works offline**, including deep-linked URLs like `/wrestlers/abc-123` or `/albums/xyz`.

---

## Out of scope
- Offline writes (admin edits while offline) — admin must be online to save changes.
- Video files (large; would explode storage). Videos remain online-only unless explicitly added later.
