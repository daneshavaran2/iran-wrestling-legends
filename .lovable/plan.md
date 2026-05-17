## هدف
حذف کامل وابستگی به اینترنت و Supabase در زمان اجرا؛ همهٔ داده‌ها، عکس‌ها و ویدیوها از داخل `public/` و `public/data/snapshot.json` خوانده شوند. پنل ادمین بتواند فایل آپلود کند و snapshot را به‌روز نگه دارد. UI با Lazy + Skeleton روان بماند. اسکریپت بیلد همه چیز را همگام کند.

---

## ۱) اسکریپت snapshot (تولید و به‌روزرسانی)

فایل جدید: `scripts/build-snapshot.mjs`

- ورودی: داده‌های موجود در `src/data/*` + هر چه در `server` (SQLite در حالت توسعه) موجود است + فایل‌های فعلی `public/data/snapshot.json` (merge).
- خروجی: `public/data/snapshot.json` با ساختار:
  ```json
  { "generatedAt": "...", "version": N, "tables": { "wrestlers": [...], "albums": [...], "history_sections": [...], "buildings": [...], "books": [...], "app_settings": [...] } }
  ```
- اسکن `public/images/**` و `public/videos/**` و ساخت `public/images/manifest.json` و `public/videos/manifest.json` (نگاشت نام منطقی → مسیر محلی).
- دستورات npm:
  - `npm run snapshot:build` → ساخت کامل
  - `npm run snapshot:update` → merge افزایشی (فقط رکوردهای تغییر‌یافته)

---

## ۲) آپلود Drag & Drop در پنل ادمین

کامپوننت موجود `UploadDropzone.tsx` بازنویسی می‌شود و به این مسیرهای API متصل می‌شود:

- `POST /api/admin/assets` در `server/src/routes/uploads.ts`:
  - عکس → `public/images/<category>/<uuid>.webp` (sharp + resize + webp 82%)
  - ویدیو → `public/videos/<category>/<uuid>.<ext>` (pass-through)
  - بعد از ذخیره، رکورد متناظر در `snapshot.json` به‌روز می‌شود (مسیر فایل + متادیتا).
- در حالت Production (داخل کانتینر/Liara): فایل‌ها به `public/` نوشته و در همان build serve می‌شوند. هشدار به کاربر: برای پایداری بین deploy ها بهتر است volume به `public/images` و `public/videos` mount شود (در `docker-compose.yml` اضافه می‌شود).
- صفحات ادمین که از این آپلودر استفاده می‌کنند: `AdminWrestlerEditPage`, `AdminAlbumsPage`, `AdminBuildingsPage`, `AdminBooksPage`, `AdminHistoryPage`, `AdminAboutPage`, `AdminAudioPage`.

---

## ۳) Lazy Loading + Skeleton واقعی

- استفاده از `LazyImage` موجود برای همهٔ `<img>` ها (placeholder blur + `loading="lazy"` + `decoding="async"`).
- ایجاد `src/components/ui/VideoSkeleton.tsx` و استفاده در `WrestlerProfilePage`، `AlbumGalleryPage`، `BuildingDetailPage`.
- در لیست‌ها (`WrestlersListPage`، `AlbumsListPage`، `BooksListPage`، `BuildingsListPage`، `HistoryListPage`) به‌جای spinner، از `skeleton-cards` با تعداد آیتم برابر صفحه فعلی استفاده می‌شود.
- `IntersectionObserver` برای پیش‌بارگذاری ۲ صفحهٔ بعدی thumbnail ها.

---

## ۴) اسکریپت Publish/Build

اصلاح `package.json`:
```
"prebuild": "node scripts/build-snapshot.mjs",
"build": "vite build",
"postbuild": "node scripts/copy-public-media.mjs"
```

- `scripts/copy-public-media.mjs`: مطمئن می‌شود `dist/images`, `dist/videos`, `dist/data/snapshot.json` کامل کپی شده‌اند (Vite معمولاً public را کپی می‌کند، این فقط verify + گزارش حجم).
- اسکریپت‌های `scripts/deploy.sh` و `scripts/deploy.ps1` قبل از rsync اول `npm run snapshot:build` را اجرا می‌کنند.
- `vite.config.ts`: حذف بلوک `manualChunks.supabase` و حذف `runtimeCaching` مربوط به `*.supabase.co` (دیگر استفاده نمی‌شود).

---

## ۵) قطع کامل اتصال به اینترنت در runtime

- `src/lib/supabase.ts` فقط از `snapshot.json` می‌خواند (همین حالا هست) — تأیید و حذف هر import باقی‌مانده.
- `useChatAssistant` و `useTranslation` در حالت آفلاین به `src/lib/offlineAssistant.ts` و کش locale ها fallback می‌کنند (پیام واضح "حالت آفلاین").
- `BackgroundMusicPlayer` فایل‌ها را از `/audio/manifest.json` می‌خواند.
- service worker (`public/sw.js`) precache همهٔ `images/videos/audio/data` با استراتژی CacheFirst.

---

## فایل‌های تغییر/ایجاد

ایجاد:
- `scripts/build-snapshot.mjs`
- `scripts/copy-public-media.mjs`
- `src/components/ui/VideoSkeleton.tsx`
- `server/src/routes/uploads.ts` (بسط)

ویرایش:
- `package.json` (scripts)
- `vite.config.ts` (حذف کش supabase + chunk)
- `src/components/UploadDropzone.tsx`
- صفحات ادمین لیست‌شده در بخش ۲
- صفحات لیست/پروفایل ذکر شده در بخش ۳
- `docker-compose.yml` (volume برای public/images و public/videos)
- `scripts/deploy.sh` و `scripts/deploy.ps1`

---

## سؤال قبل از پیاده‌سازی
آیا الان دادهٔ کشتی‌گیرها در Supabase زنده هست و باید یک‌بار اولیه از آنجا snapshot بگیریم (یک اسکریپت seed یک‌بار مصرف)، یا از صفر با همان داده‌های `src/data/wrestlers.ts` شروع کنیم و بقیه را خودت از پنل وارد می‌کنی؟
