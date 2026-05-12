## ۱. حذف Electron

**حذف فایل‌ها:**
- `electron/main.js`, `electron/preload.js`, `electron/splash.html`
- `electron-builder.config.json`
- `.github/workflows/build-windows.yml`
- `DESKTOP_BUILD.md`

**ویرایش `package.json`:**
- حذف scripts: `electron:dev`, `electron:build`, `electron:build:win`, `electron:build:portable`
- حذف devDependencies: `electron`, `electron-builder`, `electron-log`, `electron-updater`, `concurrently`, `cross-env`, `wait-on`

**ویرایش `mem://index.md`:** حذف رفرنس‌های Electron (Kiosk Deployment / Splash Screen / Auto Updates).

نکته: نسخهٔ ویندوزی همچنان از طریق PWA (Install Prompt موجود) قابل نصب است.

---

## ۲. پخش آفلاین ویدیوهای کشتی‌گیر

زیرساخت موجود است ولی پخش آفلاین کار نمی‌کند چون URL درخواستی تگ `<video>` با URL ذخیره‌شده در cache مچ نمی‌شود (query string، Range header).

**`public/sw.js` — `handleVideoRequest`:**
- Fallback به `cache.match(cacheKey, { ignoreSearch: true })` در صورت شکست match دقیق
- لاگ بهتر برای تشخیص cache miss
- در offline + cache miss، برگرداندن 404 به‌جای 503 (تا UI پیام مناسب نشان دهد)

**`src/hooks/useOfflineDownload.ts`:**
- در `downloadImagesWithProgress` هنگام cache.put برای ویدیو، URL را با حذف query string ذخیره کن (همان کلید که SW با `ignoreSearch` پیدا می‌کند)
- اطمینان از اینکه `intro_video_url` + همهٔ `wrestler_media.url` (هر type) در لیست هستند (الان هست)

**`src/pages/WrestlerProfilePage.tsx`:**
- افزودن `crossOrigin="anonymous"` به تگ `<video>` برای CORS صحیح
- بهبود `handleError`: اگر `!navigator.onLine` پیام «ویدیو در حالت آفلاین در دسترس نیست — ابتدا از تنظیمات آفلاین دانلود کنید» (با ترجمه fa/en/ar)

**`src/pages/admin/AdminOfflineSettingsPage.tsx`:**
- افزودن یک toggle «دانلود ویدیوهای کشتی‌گیر» (پیش‌فرض روشن) با هشدار حجم بالا؛ در صورت خاموش بودن، URLهای ویدیویی از خروجی `collectSectionImageUrls('wrestlers')` فیلتر شوند

---

## فایل‌های متأثر

- **حذف:** `electron/`, `electron-builder.config.json`, `.github/workflows/build-windows.yml`, `DESKTOP_BUILD.md`
- **ویرایش:** `package.json`, `public/sw.js`, `src/hooks/useOfflineDownload.ts`, `src/pages/WrestlerProfilePage.tsx`, `src/pages/admin/AdminOfflineSettingsPage.tsx`, `mem://index.md`, `src/locales/{fa,en,ar}.json`
