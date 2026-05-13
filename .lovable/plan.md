## هدف
اپ از همان لحظهٔ اول بدون هیچ تماسی با اینترنت بین‌الملل (Supabase) کار کند. همهٔ متن‌ها، عکس‌ها و ویدیوها از فایل‌های لوکال (`/data/snapshot.json`, `/images/*`, `/videos/*`) خوانده شوند. تماس با Supabase فقط در صورت آنلاین بودن و آن هم اختیاری/پس‌زمینه باشد.

## مشکل فعلی
زیرساخت bundle آماده است (snapshot + images + videos) ولی هنوز چند نقطهٔ کد مستقیماً به Supabase وصل می‌شود و در شبکهٔ بدون دسترسی، باعث تأخیر/خطا/خالی شدن صفحه می‌شود:

1. `WrestlerContext` و `OfflineDataContext` با تأخیر ۱.۵ ثانیه refresh می‌زنند ولی این refresh هنوز هم اجرا می‌شود حتی وقتی کاربر اصلاً به اینترنت بین‌الملل دسترسی ندارد (فقط `navigator.onLine` چک می‌شود که شبکهٔ داخلی را online می‌بیند).
2. صفحات (Albums, Buildings, History, Books, About, Wrestlers, BuildingDetail, AlbumGallery, HistoryDetail, WrestlerProfile) برخی مستقیماً `supabase.from(...)` صدا می‌زنند بدون fallback به snapshot.
3. `BackgroundMusicPlayer`, `ChatAssistant`, `useTranslation`, `useBackgroundMusic` به Supabase وصل می‌شوند.
4. Edge Functions (`museum-assistant`, `translate-content`) فراخوانی می‌شوند که در آفلاین کامل تایم‌اوت می‌دهند.
5. Service Worker برای مسیرهای `*.supabase.co` تلاش به fetch می‌کند که در آفلاین، promise طولانی ایجاد می‌کند.

## تغییرات

### ۱) سوییچ سراسری "Offline-Only Mode"
- افزودن یک flag در `src/lib/runtimeMode.ts` (جدید): `isOfflineOnly()` که از `localStorage('offlineOnly')` یا `import.meta.env.VITE_OFFLINE_ONLY` می‌خواند. به‌صورت پیش‌فرض `true` (چون کاربر اعلام کرده دسترسی ندارد).
- یک wrapper سبک `safeSupabaseCall(fn, fallback, timeoutMs=2000)` که اگر `isOfflineOnly()` بود، بلافاصله `fallback` را برمی‌گرداند؛ در غیر این صورت با تایم‌اوت اجرا می‌کند.

### ۲) Context ها
- `WrestlerContext` و `OfflineDataContext`:
  - مرحلهٔ اول: همیشه از `loadSnapshot()` پر شوند (الان همینطور هست).
  - مرحلهٔ دوم: `tryRefresh` فقط اگر `!isOfflineOnly() && navigator.onLine` و pingTest موفق به Supabase داشت، اجرا شود. در غیر این صورت کلاً skip.

### ۳) صفحات مصرف‌کنندهٔ Supabase
برای هر کدام از این صفحات، اول از snapshot لوکال بخوان و فقط در حالت آنلاین، در پس‌زمینه refresh کن:
- `AlbumsListPage`, `AlbumGalleryPage` (album_photos)
- `BuildingsListPage`, `BuildingDetailPage` (building_images)
- `HistoryListPage`, `HistoryDetailPage` (history_sections, history_media)
- `BooksListPage` (books)
- `AboutMuseumPage` (app_settings, about_media)
- `WrestlersListPage`, `WrestlerProfilePage` (از قبل از Context می‌خوانند ولی media جداگانه — یکپارچه شود)

الگو:
```ts
const rows = await getTable<Album>('albums');
setAlbums(rows);
if (!isOfflineOnly() && navigator.onLine) { /* background refresh */ }
```

### ۴) عکس‌ها
- `LazyImage` از قبل `resolveBundledImage` صدا می‌زند. اضافه شود: اگر URL ریموت Supabase بود و فایل لوکال نبود و `isOfflineOnly()` بود → از `placeholder.svg` استفاده کن (به جای تلاش fetch که شکست می‌خورد و طولانی می‌کشد).

### ۵) ویدیوها
- `bundledVideos.ts`: اگر `isOfflineOnly()` بود و local موجود نبود، رشتهٔ خالی برگردان (تا `<video>` تلاش بیهوده نکند) و یک خطای دوستانه نمایش داده شود (همان منطق فعلی empty state).

### ۶) ویژگی‌های وابسته به Supabase/AI در حالت آفلاین
- `ChatAssistant`: اگر `isOfflineOnly()` پیام دکمه/UI را به «در حالت آفلاین در دسترس نیست» تغییر دهد و تماس edge function صورت نگیرد.
- `useTranslation` (Gemini translate): در حالت آفلاین فقط locale های JSON محلی استفاده شوند، تماس Edge Function skip شود (الان tier cache هست — لایهٔ remote حذف شود).
- `BackgroundMusicPlayer` / `useBackgroundMusic`: تنظیمات از snapshot (`app_settings`) خوانده شود، فایل موسیقی هم اگر در `/data/...` نبود، silent باشد.
- ادمین‌ها (`/admin/*`) و `AuthContext`: در حالت آفلاین، صفحهٔ ادمین باید پیام واضح بدهد که نیاز به اینترنت دارد و سعی به اتصال نکند.

### ۷) Service Worker (`public/sw.js`)
- bump به `v8`.
- اگر request به `*.supabase.co` بود و آفلاین بود، بلافاصله 504 محلی برگردان (به‌جای fetch تایم‌اوت طولانی).
- precache: `/data/snapshot.json`, `/images/manifest.json`, `/videos/manifest.json`, locales.

### ۸) صفحهٔ ادمین برای toggle
- در `AdminGeneralSettingsPage` یک سوییچ ساده «حالت آفلاین کامل» (نوشتن در localStorage). به‌صورت پیش‌فرض روشن.

## ایمنی
- بدون snapshot هم اپ crash نکند (صفحات پیام «داده‌ای موجود نیست» بدهند).
- هیچ تغییری در کد ادمین یا اسکریپت `sync:content` ایجاد نمی‌شود؛ فقط مسیر مصرف داده در runtime امن می‌شود.

## نتیجه
با اولین باز شدن اپ روی کیوسک، حتی بدون هیچ دسترسی به اینترنت بین‌الملل، تمام صفحات (متن، عکس، ویدیو) فوراً از فایل‌های لوکال پر می‌شوند و هیچ تماس Supabase ای صورت نمی‌گیرد.
