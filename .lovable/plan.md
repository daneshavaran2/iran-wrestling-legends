## هدف

اپ باید کامل بدون نیاز به Supabase کار کند: همه ویدیوها، متن‌ها، تصاویر و محتوای کشتی‌گیران، تاریخ، آلبوم‌ها، کتاب‌ها، بناها و درباره موزه از داخل خود build اپ بارگذاری شوند. Supabase فقط برای پنل ادمین استفاده شود.

## معماری پیشنهادی

```text
scripts/bundle-content.mjs   ← اسکریپت واحد sync
public/
  data/
    snapshot.json            ← تمام جداول DB
  videos/
    manifest.json
    <hash>.mp4
  media/
    manifest.json
    <hash>.webp / .jpg
src/lib/
  contentSnapshot.ts         ← loader محتوای bundle شده
  bundledMedia.ts            ← resolver عکس + ویدیو
```

## مراحل

1. **گسترش اسکریپت bundle** (`scripts/bundle-content.mjs` جایگزین `bundle-videos.mjs`):
   - واکشی همه جداول عمومی: `wrestlers`, `wrestler_media`, `achievements`, `history_sections`, `history_media`, `buildings`, `building_images`, `albums`, `album_photos`, `books`, `about_media`, `app_settings`.
   - نوشتن کل دیتا در `public/data/snapshot.json` با `generatedAt` و version.
   - استخراج همه URLهای رسانه (image_url, hero_image_url, cover_image_url, url, intro_video_url, thumbnail, bg_music_url, about_image_url).
   - دانلود ویدیوها → `public/videos/<hash>.<ext>` + `videos/manifest.json`.
   - دانلود تصاویر → `public/media/<hash>.<ext>` + `media/manifest.json` (فقط درخواست‌شده‌ها؛ skip اگر size تغییر نکرده).
   - prune فایل‌های یتیم، idempotent، در صورت قطعی Supabase build را fail نمی‌کند (snapshot قبلی نگه داشته می‌شود).
   - log: `downloaded / updated / skipped / removed / failed / sizeMB` به تفکیک videos و images.

2. **Loader محتوای local** (`src/lib/contentSnapshot.ts`):
   - با fetch (`/data/snapshot.json`) دیتا را در حافظه نگه می‌دارد.
   - API: `getSnapshot()`, `getWrestlers()`, `getHistorySections()` و ...
   - lazy + cache در `localStorage` به عنوان لایه دوم.

3. **استراتژی Local-first در دیتا**:
   - `WrestlerContext` و `OfflineDataContext` ابتدا snapshot.json را می‌خوانند و UI را فوراً نمایش می‌دهند.
   - سپس در پس‌زمینه (اگر آنلاین) از Supabase تازه‌سازی می‌کنند؛ خطای Supabase دیگر باعث empty state نمی‌شود.
   - در حالت کاملاً آفلاین یا قطع DNS، snapshot کافی است.

4. **Resolver رسانه واحد** (`src/lib/bundledMedia.ts`):
   - ادغام `bundledVideos.ts` فعلی + manifest عکس‌ها.
   - sync: `resolveBundledMedia(url)` → اگر `<hash>` در manifest و فایل local probe شده، مسیر local، در غیر اینصورت remote.
   - async variant برای موارد حساس (intro video).
   - مکانیزم blacklist + fallback به remote روی خطا (همان الگوی فعلی).

5. **اعمال در کامپوننت‌ها**:
   - `WrestlerCard`, `WrestlerProfilePage` (intro video + image_url + media)، `MediaGallery`, `BuildingDetailPage`, `AlbumGalleryPage`, `HistoryDetailPage`, `BooksListPage`, `AboutMuseumPage`, `BackgroundMusicPlayer` همگی از `resolveBundledMedia` استفاده کنند.
   - `LazyImage` به‌صورت پیش‌فرض از resolver عبور دهد.

6. **Prebuild hook**:
   - `package.json` → `prebuild: node scripts/bundle-content.mjs || true`.
   - `npm run build` به‌تنهایی کافی است؛ شکست sync باعث خطای build نمی‌شود اما لاگ هشدار می‌دهد.

7. **Service Worker**:
   - افزودن `/data/snapshot.json`, `/videos/manifest.json`, `/media/manifest.json` و فایل‌های `media/` به precache (StaleWhileRevalidate).
   - این تضمین می‌کند بعد از اولین بازدید، حتی بدون شبکه و بدون Supabase همه چیز کار کند.

8. **پنل ادمین**:
   - بدون تغییر؛ همچنان مستقیم با Supabase کار می‌کند (نوشتن/ویرایش).
   - دکمه «Rebuild content snapshot» در `AdminGeneralSettingsPage` که اسکریپت sync را در deploy بعدی اجرا می‌کند (یا یادآور دستی).

9. **اعتبارسنجی**:
   - اجرای `node scripts/bundle-content.mjs` و بررسی حجم/تعداد فایل‌ها.
   - تست در DevTools با blocking دامنه `*.supabase.co` → اپ باید کامل کار کند: لیست کشتی‌گیران، ویدیوی معرفی، گالری، تاریخ، بناها، آلبوم‌ها.
   - تست روی موبایل/iOS برای پخش ویدیو local.

## ریسک‌ها و یادداشت‌ها

- حجم build بزرگ می‌شود (احتمالاً 50–500MB بسته به ویدیوها). برای کیوسک مشکلی نیست.
- هر بار محتوای جدید در پنل ادمین → نیاز به re-build و re-deploy برای appear شدن آفلاین.
- فایل‌های `.mov` در sync به `.mp4` (ffmpeg) تبدیل شوند تا روی iOS/Android پخش شوند — اگر ffmpeg در محیط build نبود، فایل اصلی نگه داشته شود و log هشدار بدهد.
