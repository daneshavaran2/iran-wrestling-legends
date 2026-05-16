# پلن: ورود مستقیم به پنل ادمین + مهاجرت داده از پنل

دو هدف:
1. حذف کامل لاگین — کلیک روی چرخ‌دنده در صفحه‌ی اصلی مستقیم به `/admin` می‌برد.
2. دکمه‌ی «مهاجرت داده از Supabase» داخل پنل که تمام جداول را در یک کلیک به بک‌اند Node منتقل می‌کند.

---

## ۱) دسترسی باز ادمین

### فرانت

- **`src/pages/MuseumHomePage.tsx`** — کلیک چرخ‌دنده به‌جای `/admin/login` به `/admin` می‌رود.
- **`src/App.tsx`** — تمام مسیرهای ادمین که قبلاً حذف شده‌اند برمی‌گردند، بدون `ProtectedRoute` و بدون `AuthProvider`:
  ```text
  /admin                → AdminDashboardPage
  /admin/wrestlers      → AdminWrestlersPage
  /admin/wrestlers/:id  → AdminWrestlerEditPage
  /admin/history        → AdminHistoryPage
  /admin/buildings      → AdminBuildingsPage
  /admin/books          → AdminBooksPage
  /admin/albums         → AdminAlbumsPage
  /admin/audio          → AdminAudioPage
  /admin/about          → AdminAboutPage
  /admin/offline        → AdminOfflineSettingsPage
  /admin/settings       → AdminGeneralSettingsPage
  /admin/backup         → AdminBackupPage
  /admin/migrate        → AdminMigratePage  (جدید)
  ```
- **`src/components/AdminLayout.tsx`** — حذف `useAuth()` و دکمه‌ی Logout؛ جایگزین با دکمه‌ی «بازگشت به موزه» که به `/` می‌رود. اضافه شدن آیتم نوبار «مهاجرت داده».
- **حذف فایل‌ها**: `AdminLoginPage.tsx`, `AdminSignupPage.tsx`, `AdminSetupPage.tsx`, `AdminResetPasswordPage.tsx`, `src/contexts/AuthContext.tsx`, `src/components/ProtectedRoute.tsx`.

### بک‌اند

در پروژه ما بک‌اند Node اکنون با JWT از نوشتن‌ها محافظت می‌کند. برای حالت کیوسک باز:

- **`server/src/env.ts`** — متغیر جدید `OPEN_ADMIN` (پیش‌فرض `true` در dev، در production هم پیش‌فرض `true` چون این یک نصب لوکال است).
- **`server/src/middleware/requireAdmin.ts`** — اگر `OPEN_ADMIN=true` بود middleware اجازه می‌دهد بدون توکن عبور کند.
- **`docker-compose.yml`** — `OPEN_ADMIN=true` در محیط `api`.
- روت‌های `/api/auth/*` حذف نمی‌شوند ولی استفاده نخواهند شد.

این یعنی تمام `POST/PATCH/DELETE` بدون توکن کار می‌کنند — مناسب کیوسک پشت nginx لوکال، نه برای اینترنت عمومی. این تصمیم در `README` هشدار داده می‌شود.

---

## ۲) مهاجرت داده — دکمه‌ی داخل پنل

### روت بک‌اند جدید

**`server/src/routes/migrate.ts`** — `POST /api/admin/migrate-from-supabase`

ورودی:
```json
{ "supabaseUrl": "https://xxx.supabase.co", "anonKey": "eyJ..." }
```

منطق:
1. لیست جداول هاردکُد: `wrestlers, wrestler_media, achievements, albums, album_photos, history_sections, history_media, buildings, building_images, books, about_media, app_settings, translations`.
2. برای هر جدول: `GET {supabaseUrl}/rest/v1/{table}?select=*` با هدر `apikey: {anonKey}` (تمام این جداول RLS عمومی برای SELECT دارند).
3. برای هر ردیف: تبدیل boolean→0/1، insert با `INSERT OR REPLACE INTO {table}`.
4. خروجی پیشرفت با streaming SSE: `event: table` با `{ name, count, ok }` و در پایان `event: done`.

این روت نیازی به فاش کردن service-role-key ندارد چون تمام جداول `Public can view` هستند. فایل‌های Storage هم public هستند ولی در این مرحله دانلود نمی‌شوند (طبق انتخاب کاربر) — URL‌های `supabase.co/storage/...` در ستون‌ها باقی می‌مانند و در حالت آنلاین قابل نمایش‌اند. برای کپی فایل‌ها می‌توان بعداً اسکریپت CLI را اجرا کرد.

### صفحه‌ی پنل

**`src/pages/admin/AdminMigratePage.tsx`** (جدید):
- دو فیلد فرم: `Supabase URL` و `Anon Key` با مقدار پیش‌فرض پروژه‌ی فعلی پر می‌شوند:
  - `https://etbekvhdroqiddcteqdq.supabase.co`
  - anon key از `.env`.
- دکمه «شروع مهاجرت» → `EventSource('/api/admin/migrate-from-supabase?...')` یا `fetch` با خواندن stream.
- نمایش لیست جداول با وضعیت ✓/⌛/✗ و تعداد ردیف منتقل‌شده.
- لینک به `/admin` در پایان.

### فال‌بک snapshot

پس از پایان مهاجرت، اولین `GET /api/snapshot.json` خودکار به‌روزرسانی می‌شود — هیچ کاری در فرانت لازم نیست.

---

## ساختار تغییرات فایل

```text
src/
  App.tsx                                ✎ بازگردانی روت‌های /admin/*
  components/AdminLayout.tsx             ✎ حذف useAuth، اضافه شدن «مهاجرت»
  components/ProtectedRoute.tsx          ✗ حذف
  contexts/AuthContext.tsx               ✗ حذف
  pages/MuseumHomePage.tsx               ✎ گیر → /admin
  pages/admin/AdminMigratePage.tsx       + جدید
  pages/admin/AdminLoginPage.tsx         ✗ حذف
  pages/admin/AdminSignupPage.tsx        ✗ حذف
  pages/admin/AdminSetupPage.tsx         ✗ حذف
  pages/admin/AdminResetPasswordPage.tsx ✗ حذف

server/src/
  env.ts                                 ✎ OPEN_ADMIN
  middleware/requireAdmin.ts             ✎ bypass when OPEN_ADMIN
  routes/migrate.ts                      + جدید
  index.ts                               ✎ register migrate routes

docker-compose.yml                       ✎ OPEN_ADMIN=true
```

## ریسک‌ها

- در حالت `OPEN_ADMIN=true` هر کس به شبکه‌ی کیوسک دسترسی داشته باشد می‌تواند داده‌ها را تغییر دهد. در `README` و در یک بنر نارنجی بالای صفحات `/admin/*` تذکر داده می‌شود.
- صفحه‌ی مهاجرت در پیش‌نمایش Lovable کار نمی‌کند چون به بک‌اند Node نیاز دارد. در پنل پیامی نمایش داده می‌شود اگر `/api/health` پاسخ ندهد.
- صفحات قدیمی `AdminLoginPage/Signup/Setup/Reset` به‌طور کامل حذف می‌شوند — هیچ لینکی به آن‌ها در پروژه نمی‌ماند.
