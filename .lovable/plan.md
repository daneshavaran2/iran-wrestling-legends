## هدف
حذف کامل صفحهٔ لاگین/ثبت‌نام ادمین و قطع هر اتصال زنده با Supabase. تمام عکس‌ها و ویدیوها به‌صورت استاتیک داخل خود فرانت (پوشه‌های `public/images` و `public/videos`) قرار می‌گیرند و فرانت فقط از `snapshot.json` محلی می‌خواند.

## 1) حذف صفحهٔ لاگین (آنچه در اسکرین‌شات دیده می‌شود)
- این صفحه از نسخهٔ منتشر‌شدهٔ قدیمی است. برای اطمینان، یک‌بار `Publish` مجدد لازم است (تب publish بعد از انجام تغییرات).
- بررسی و حذف کامل هر مرجع به مسیر `/admin/login`، `AdminLoginPage`، `AdminSignupPage`، `AdminSetupPage`، `AdminResetPasswordPage` در:
  - `src/App.tsx`
  - `src/components/AdminLayout.tsx`
  - `src/pages/MuseumHomePage.tsx`
- حذف فایل خالی `src/contexts/AuthContext.tsx` و `src/components/ProtectedRoute.tsx` و پاک‌سازی import های مربوطه.

## 2) قطع کامل Supabase از فرانت
- حذف فایل‌ها:
  - `src/integrations/supabase/client.ts`
  - `src/integrations/supabase/types.ts`
  - کل پوشهٔ `supabase/` (edge functions و config)
  - `src/pages/admin/AdminMigratePage.tsx` و route مربوطه
  - `server/src/routes/migrate.ts` و `server/scripts/migrate-from-supabase.mjs`
  - `scripts/bundle-content.mjs` (بعد از اجرای پایانی، در گام ۴)
- بازنویسی `src/lib/supabase.ts` به‌عنوان یک shim کاملاً آفلاین:
  - `select` فقط از `snapshot.json` می‌خواند (هیچ `apiFetch` به جای Supabase نمی‌رود).
  - `insert/update/delete` فقط Node API (`/api/...`) را صدا می‌زند.
  - `auth/functions/realtime/storage.signedUrl` به نو-آپ تبدیل می‌شود.
- حذف وابستگی `@supabase/supabase-js` از `package.json`.
- پاک‌سازی `VITE_SUPABASE_*` از `.env.example`.

## 3) بسته‌بندی همهٔ مدیا داخل فرانت
- اجرای یک‌بارهٔ `scripts/bundle-content.mjs` (همین حالا، با کلید فعلی) برای کشیدن:
  - تمام تصاویر باکت‌های `wrestler-media`, `album-media`, `building-media` → `public/images/<hash>.<ext>` + `public/images/manifest.json`
  - تمام ویدیوها → `public/videos/<hash>.<ext>` + `public/videos/manifest.json`
  - فایل‌های صوتی موزه (`museum-audio`) → `public/audio/<hash>.<ext>` + `public/audio/manifest.json` (افزودن این بخش به اسکریپت)
  - snapshot کامل جداول → `public/data/snapshot.json` با URLهای داخلی (`/images/...`, `/videos/...`, `/audio/...`)
- بعد از اجرا، اسکریپت `bundle-content.mjs` و `prebuild` در `package.json` حذف می‌شود تا بیلد دیگر هرگز Supabase را صدا نزند.
- افزودن `src/lib/bundledAudio.ts` مشابه `bundledImages.ts` برای resolve کردن URLهای صوتی محلی.
- اضافه‌کردن resolver به نقاط ضعف فعلی: `BackgroundMusicPlayer.tsx`, `useBackgroundMusic.ts` (الان از Supabase Storage می‌خوانند).

## 4) بک‌اند Node (CRUD ادمین)
- چون مهاجرت Supabase حذف شد، بک‌اند در اولین اجرا SQLite را از روی همین `public/data/snapshot.json` seed می‌کند:
  - `server/src/db.ts` در init اگر جداول خالی بودند، snapshot را می‌خواند و `INSERT` می‌کند.
- آپلود مدیای جدید از پنل ادمین به `/data/uploads/...` می‌رود (همان مسیر فعلی).

## 5) جزئیات فنی
- چون `src/integrations/supabase/types.ts` خودکار تولید می‌شود ولی دیگر استفاده نخواهد شد، type های مورد نیاز پروژه را به `src/types/db.ts` منتقل می‌کنیم (فقط interfaceهایی که در کد import شده‌اند: `Wrestler`, `Album`, `HistorySection`, `Building`, `Book`, `AppSettings`).
- در `src/lib/supabase.ts` کلاس `QueryBuilder` ساده می‌شود: فقط مسیر in-memory روی snapshot را نگه می‌دارد.

## ریسک‌ها
- اگر اجرای پایانی `bundle-content.mjs` با خطا مواجه شود، باید توکن service-role در `.env` در دسترس باشد؛ در غیر این صورت snapshot ناقص می‌ماند.
- پنل ادمین بدون مهاجرت، روی کیوسک فقط داده‌های seed شده از snapshot را خواهد داشت؛ تغییرات بعدی محلی است.

## فایل‌های تغییریافته/حذفی (خلاصه)
- حذف: `supabase/**`, `src/integrations/supabase/**`, `src/pages/admin/AdminMigratePage.tsx`, `server/src/routes/migrate.ts`, `server/scripts/migrate-from-supabase.mjs`, `scripts/bundle-content.mjs` (بعد از اجرای پایانی)، `src/contexts/AuthContext.tsx`, `src/components/ProtectedRoute.tsx`
- ویرایش: `src/App.tsx`, `src/components/AdminLayout.tsx`, `src/pages/MuseumHomePage.tsx`, `src/lib/supabase.ts`, `src/lib/bundledImages.ts` (+ `bundledAudio.ts` جدید)، `package.json`, `.env.example`, `server/src/db.ts`, `server/src/index.ts`
