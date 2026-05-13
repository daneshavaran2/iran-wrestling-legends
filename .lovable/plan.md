## مشکل

در حالت آفلاین هیچ عکس و کارتی نمایش داده نمی‌شود چون:

1. **عکس‌ها بسته‌بندی نشده‌اند.** فایل `public/images/manifest.json` خالی است (`count: 0`)، یعنی اسکریپت `sync:content` تا حالا برای عکس‌ها اجرا نشده. بنابراین آدرس‌های داخل `snapshot.json` هنوز به Supabase اشاره می‌کنند و در حالت آفلاین، `LazyImage` همه‌ی آن‌ها را با `placeholder.svg` جایگزین می‌کند.

2. **`getThumbnailUrl` آدرس‌ها را قبل از تبدیل محلی خراب می‌کند.** در `WrestlerCard` (و چند جای دیگر) آدرس Supabase اول از مسیر `/storage/v1/object/public/...` به `/storage/v1/render/image/public/...?width=...` تبدیل می‌شود، بعد به `LazyImage` می‌رود. در نتیجه `resolveBundledImage` نمی‌تواند آن کلید را در manifest پیدا کند چون manifest با کلید نسخه‌ی اصلی ساخته شده.

3. **متن کارت‌ها هم دیده نمی‌شود** چون وقتی `image_url` به یک URL محلی غایب تبدیل می‌شود، grid placeholder های تمام‌قد نشان می‌دهد و چون snapshot واقعاً داده‌ی wrestlers/buildings/books دارد ولی media tables (wrestler_media, history_media, building_images, about_media) همه ۰ ردیف‌اند، صفحات گالری/جزئیات هم خالی به نظر می‌رسند.

## راه‌حل

### ۱. اصلاح `src/utils/imageOptimizer.ts`

در حالت `isOfflineOnly()` تابع `getOptimizedImageUrl` آدرس Supabase را تبدیل نکند و عینا برگرداند تا lookup در `bundledImages` کار کند. همچنین اگر آدرس از قبل محلی (`/images/...`) باشد بدون تغییر برگردانده شود.

### ۲. اصلاح `src/lib/bundledImages.ts`

تابع `lookup` علاوه بر URL خام، نسخه‌ی `render/image/public/` را هم به `object/public/` نرمالایز کند تا اگر کسی شکل بهینه‌شده‌ی آدرس را پاس داد باز هم فایل محلی پیدا شود. (به‌عنوان لایه‌ی دفاعی).

### ۳. اصلاح `src/components/ui/LazyImage.tsx`

اگر در حالت offline-only هستیم و آدرس remote است، **قبل از** fallback به placeholder یک‌بار `resolveBundledImage` را روی نسخه‌ی نرمالایز شده هم امتحان کند. اگر نه، به جای جایگزینی فوری با placeholder، هنوز سعی کند از Service Worker cache بخواند (با گذاشتن src اصلی، اجازه می‌دهیم `sw.js` اگر کش داشت پاسخ دهد).

تغییر کوچک: حالت offline-only فقط وقتی به placeholder سقوط کند که هیچ نسخه‌ی محلی یا کش‌شده‌ای وجود نداشته باشد — یعنی onError همچنان کار کند.

### ۴. اجرای واقعی `npm run sync:content`

اسکریپت در سندباکس (که اینترنت دارد) اجرا می‌شود تا:
- همه‌ی عکس‌های ارجاع‌شده در snapshot دانلود و در `public/images/` ذخیره شوند
- `manifest.json` پر شود
- آدرس‌های داخل `snapshot.json` به مسیرهای `/images/<file>` بازنویسی شوند

این مرحله تضمین می‌کند برای دیپلوی بعدی همه‌ی عکس‌ها به‌صورت bundled داخل build بروند و در روز اول هم، بدون اینترنت بین‌الملل، روی کیوسک نمایش داده شوند.

### ۵. سرویس‌ورکر

نسخه‌ی کش به `v9` بالا برده شود تا کلاینت‌های قدیمی (که snapshot قبلی با URL Supabase را دارند) بعد از به‌روزرسانی، snapshot جدید را بگیرند.

## چیزهایی که تغییر نمی‌کنند

- اسکریپت `bundle-content.mjs` (که از قبل کامل است)
- ساختار صفحه‌های ادمین
- منطق Supabase در حالت آنلاین (وقتی `offlineOnly=false` باشد همچنان تازه‌سازی می‌شود)

## فایل‌های دست‌خورده

- `src/utils/imageOptimizer.ts`
- `src/lib/bundledImages.ts`
- `src/components/ui/LazyImage.tsx`
- `public/sw.js` (bump CACHE_VERSION)
- اجرای دستی `npm run sync:content` برای پر کردن `public/images/` و بازنویسی `public/data/snapshot.json`
