## هدف
سه قابلیت اصلی برای حالت آفلاین موزه:
1. نمایش کامل کشتی‌گیران و فیلم/ویدیوهایشان بدون اینترنت
2. کارکرد چت‌بات از روی داده‌های لوکال هنگام قطعی اینترنت
3. تحویل نسخه کامل ویندوزی (Electron)

---

## ۱. کشتی‌گیران و ویدیوها در حالت آفلاین

### وضعیت فعلی
- متادیتا (لیست کشتی‌گیر، افتخارات، media records) در `localStorage` ذخیره می‌شود ✓
- تصاویر در Cache API ذخیره می‌شوند ✓
- **مشکل**: ویدیوها (`intro_video_url` و `wrestler_media` با type=video) دانلود/کش نمی‌شوند → آفلاین پخش نمی‌شوند

### تغییرات
- در `useOfflineDownload.ts` بخش `collectSectionImageUrls('wrestlers')` همهٔ URL های ویدیو هم اضافه شوند (`wrestlers.intro_video_url`، `wrestler_media.url` با type=video، `wrestler_media.thumbnail`).
- در `OfflineDataContext` تابع `cacheImages` به `cacheMedia` تغییر کند تا ویدیوها هم به Service Worker پاس داده شوند.
- در `public/sw.js`:
  - افزایش `MAX_IMAGE_CACHE_SIZE` و اضافه‌کردن یک `VIDEO_CACHE` جداگانه با محدودیت بالاتر (مثلاً ۵۰ آیتم).
  - هندل کردن request های ویدیو (mp4/webm) با استراتژی Cache-First و پشتیبانی از Range requests (لازم برای پخش ویدیو از کش).
  - هندلر پیام `CACHE_VIDEOS` در SW.
- در صفحهٔ ادمین آفلاین (`AdminOfflineSettingsPage`) اضافه شدن گزینهٔ تیک‌دار «دانلود ویدیوها» (با هشدار حجم بالا).

---

## ۲. چت‌بات آفلاین

### وضعیت فعلی
- چت‌بات فقط از طریق Edge Function `museum-assistant` با Gemini کار می‌کند → بدون اینترنت کاملاً غیرفعال است.

### راهکار: حالت Fallback لوکال
وقتی `navigator.onLine === false` یا fetch به edge function fail شد:

- یک ماژول جدید `src/lib/offlineAssistant.ts` بسازیم که:
  - دیتای کش‌شدهٔ کشتی‌گیران/افتخارات/تاریخچه/بناها/کتاب‌ها/آلبوم‌ها را از `localStorage` می‌خواند.
  - روی متن سؤال کاربر **جستجوی کلیدواژه‌ای** (token match با وزن‌دهی، normalize عربی/فارسی) انجام می‌دهد.
  - مرتبط‌ترین رکوردها (تا ۳ مورد) را پیدا کرده و یک پاسخ ساختاریافته در زبان تشخیص داده‌شده می‌سازد (template-based, با Markdown).
  - برای سؤال‌های عمومی («تاریخچه چیست؟») خلاصهٔ section مرتبط از `history_sections` را برمی‌گرداند.
- در `useChatAssistant.ts`:
  - قبل از fetch چک: اگر offline → مستقیم `offlineAssistant.answer()` و stream شبیه‌سازی (chunk به chunk با setTimeout).
  - اگر fetch fail شد → fallback به همان لوکال + پیام «پاسخ بر اساس دادهٔ آفلاین».
- در UI (`ChatAssistant.tsx`) یک badge کوچک «حالت آفلاین» وقتی پاسخ از منبع لوکال بیاید.

### محدودیت‌ها (به کاربر گفته می‌شود)
- پاسخ‌های آفلاین تولیدی نیستند، بلکه بازیابی از دیتای موزه‌اند → برای سؤال‌های خارج از دامنه دیتای کش‌شده پاسخ مفیدی ندارد.

---

## ۳. نسخهٔ کامل ویندوزی

### وضعیت فعلی
- `electron/main.js`، `electron/preload.js`، `electron/splash.html` و `electron-builder.config.json` قبلاً موجودند.
- `package.json` فاقد scripts و dev-dependencies برای Electron است.

### تغییرات
- اضافه‌کردن به `package.json`:
  - devDeps: `electron`, `electron-builder`, `concurrently`, `wait-on`.
  - scripts:
    - `electron:dev` – اجرای Vite + Electron همزمان
    - `electron:build` – `vite build` + `electron-builder --win` (NSIS installer + Portable)
    - `electron:build:win` – build مستقیم برای ویندوز x64
- بررسی `electron/main.js` برای:
  - `loadFile('dist/index.html')` (نه dev URL در production)
  - `base: './'` در `vite.config.ts` (برای path نسبی فایل)
  - فعال‌سازی fullscreen + kiosk mode در حالت بسته‌شده
- مستندسازی در `DESKTOP_BUILD.md` با دستورات نهایی.

### خروجی نهایی
- `release/موزه کشتی ایران-Setup-{version}.exe` (نصب‌کننده NSIS با انتخاب مسیر و پشتیبانی فارسی)
- `release/موزه کشتی ایران-Portable-{version}.exe` (قابل‌حمل، بدون نصب)

### نکته
- ساخت واقعی فایل `.exe` نیاز به ماشین ویندوز یا Wine دارد. کاربر می‌تواند روی PC ویندوز یا از طریق GitHub Actions (workflow اضافه می‌شود) build بگیرد.
- یک workflow جدید `.github/workflows/build-windows.yml` که روی push tag، نسخهٔ ویندوزی را build و در GitHub Releases منتشر کند.

---

## فایل‌های جدید/تغییریافته
- `src/lib/offlineAssistant.ts` (جدید)
- `src/hooks/useChatAssistant.ts`
- `src/components/ChatAssistant.tsx`
- `src/contexts/OfflineDataContext.tsx`
- `src/hooks/useOfflineDownload.ts`
- `src/pages/admin/AdminOfflineSettingsPage.tsx`
- `public/sw.js`
- `package.json`
- `electron/main.js` (در صورت نیاز)
- `.github/workflows/build-windows.yml` (جدید)
- `DESKTOP_BUILD.md`

## ترتیب اجرا
۱. کش ویدیوهای کشتی‌گیر (SW + download hook)
۲. چت‌بات آفلاین (offlineAssistant + integration)
۳. اسکریپت‌ها و workflow ویندوز
