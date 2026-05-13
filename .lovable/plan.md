## هدف
کار کاملاً آفلاین: عکس‌ها، ویدیوها و تمام نوشته‌ها بدون نیاز به اتصال اولیه به اینترنت یا Supabase پخش/نمایش داده شوند. در حال حاضر فقط ویدیوها و متن‌ها بسته‌بندی می‌شوند؛ عکس‌ها همچنان از Supabase Storage بارگذاری می‌شوند.

## تغییرات

### 1) `scripts/bundle-content.mjs` — اضافه شدن `syncImages()`
- استخراج همهٔ URLهای تصویر از snapshot:
  - `wrestlers.image_url`, `wrestlers.profile_image`
  - `wrestler_media` (type=image یا photo) → `url` و `thumbnail_url`
  - `history_sections.image_url`, `history_media` (type=image)
  - `buildings.image_url`, `building_images.url`
  - `albums.cover_image`, `album_photos.url` و `thumbnail_url`
  - `books.cover_image`, `about_media` (type=image)
  - `app_settings` فیلدهای تصویری (لوگو، پس‌زمینه، ...)
- ذخیره در `public/images/<sha1>.<ext>` با همان الگوی atomic + skip-by-size + orphan cleanup فعلی ویدیوها.
- نوشتن `public/images/manifest.json` با همان شکل manifest ویدیوها.
- `rewriteSnapshotImageUrls()` همهٔ URLهای موفق را در snapshot به `/images/<file>` تبدیل می‌کند و نسخهٔ remote را در `__remoteUrl` نگه می‌دارد.

### 2) `src/lib/bundledImages.ts` (جدید)
- مشابه `bundledVideos.ts`: `loadImageManifest()`, `resolveBundledImage(url)` با short-circuit برای `/images/...` و fallback به remote اگر فایل محلی موجود نبود.
- چون اکثر URLها در snapshot از قبل rewrite شده‌اند، `<img src>` مستقیم کار می‌کند؛ این helper برای تصاویری که از کد یا کش‌های قدیمی می‌آیند استفاده می‌شود.

### 3) `LazyImage` و `WrestlerCard` و چند مصرف‌کنندهٔ مستقیم
- پاس دادن `src` از طریق `resolveBundledImage()` تا اگر هنوز URL ریموتی به دست کامپوننت رسید، به local map شود.
- بدون تغییر در ظاهر یا منطق نمایش.

### 4) `public/sw.js`
- افزودن `/images/manifest.json` به `STATIC_ASSETS` (precache).
- اضافه کردن استراتژی `CacheFirst` برای مسیرهای `/images/*` (همانند `/videos/*`).
- bump `CACHE_VERSION` به `v7`.

### 5) `package.json`
- بدون تغییر در `build` (همان `vite build`).
- `sync:content` همچنان به‌صورت محلی توسط ادمین اجرا می‌شود؛ حالا علاوه بر متن و ویدیو، تصاویر را هم دانلود می‌کند.

### 6) `KIOSK_README.md`
- یادداشت کوتاه: گردش کار = ویرایش در ادمین → `npm run sync:content` (متن + عکس + ویدیو) → commit → deploy. اپ بدون اتصال اولیه کار می‌کند.

## ایمنی
- اگر دانلود یک تصویر شکست خورد: نسخهٔ قبلی حفظ می‌شود و URL ریموت در snapshot باقی می‌ماند (دقیقاً مثل ویدیو).
- اگر کل دانلود تصاویر شکست خورد، snapshot قبلی و فایل‌های موجود دست‌نخورده می‌مانند.
- هیچ تغییری در رفتار آنلاین/sync پس‌زمینه ایجاد نمی‌شود.

## نتیجه
بعد از یک‌بار `npm run sync:content` و deploy، اپ روی کیوسک حتی بدون اینترنت در اولین بار اجرا، تمام عکس‌ها، نوشته‌ها و ویدیوها را از فایل‌های لوکال نشان می‌دهد.