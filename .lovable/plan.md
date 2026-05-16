
# پلن گزینه ۱ — حذف کامل بک‌اند، حالت آفلاین خالص

## هدف
حذف کامل وابستگی به Supabase. تمام محتوای موزه از فایل‌های استاتیک در خود build اپ سرو شود. صفر سرور، صفر دیتابیس، صفر API.

## معماری نهایی

```text
build/
├── index.html
├── assets/...               (JS/CSS فرانت‌اند)
├── data/
│   └── snapshot.json        ← تنها منبع داده (wrestlers, achievements, ...)
├── images/
│   └── {hash}.webp          ← همه عکس‌ها
├── videos/
│   └── {hash}.mp4           ← همه ویدیوها
├── audio/
│   └── {hash}.mp3           ← موسیقی پس‌زمینه
└── sw.js                    ← service worker (همان فعلی)

content/                     ← منبع محتوا (در گیت، خارج از build)
├── snapshot.json            ← قابل ویرایش با ادمین لوکال
├── images/                  ← فایل‌های اصلی
├── videos/
└── audio/
```

## بخش ۱ — حذف Supabase از کلاینت

### حذف
- پکیج `@supabase/supabase-js` از `package.json`
- فولدر `src/integrations/supabase/`
- فایل `src/lib/supabase.ts`
- فولدر `supabase/` (config.toml و functions)
- متغیرهای `VITE_SUPABASE_*` از `.env`

### بازنویسی به `src/lib/dataStore.ts`
یک ماژول ساده که فقط از `loadSnapshot()` می‌خواند. همان شکل API را نگه می‌دارد تا تغییرات در صفحات حداقلی باشد:

```ts
export const dataStore = {
  wrestlers: { list, get },
  achievements: { listByWrestler },
  wrestlerMedia: { listByWrestler },
  historySections: { list, get, getBySlug },
  historyMedia: { listBySection },
  buildings: { list, get },
  buildingImages: { listByBuilding },
  books: { list },
  albums: { list, get },
  albumPhotos: { listByAlbum },
  aboutMedia: { list },
  appSettings: { get },
};
```

تمام call site های `supabase.from('...').select(...)` (در `WrestlerContext`, `OfflineDataContext`, تمام `pages/*` و `pages/admin/*`, `hooks/*`) به این جایگزین می‌شوند.

## بخش ۲ — حذف قابلیت‌های وابسته به سرور

### قابلیت‌هایی که حذف می‌شوند
| ویژگی | علت | جایگزین |
|---|---|---|
| پنل ادمین درون‌اپ (signup/login/CRUD) | بدون سرور ممکن نیست | ابزار ادمین جداگانه (بخش ۳) |
| چت AI درون‌اپ | نیاز به Edge Function + API key | پاسخ‌های آماده آفلاین از `offlineAssistant.ts` (که از قبل وجود دارد) |
| ترجمه پویا با Gemini | همان دلیل | فقط ترجمه‌های از پیش تولیدشده در `snapshot.json` |
| TTS با Gemini | همان دلیل | استفاده از Web Speech API مرورگر (داخلی، آفلاین در ویندوز) |
| Backup/Export از DB | DB وجود ندارد | دانلود `snapshot.json` فعلی |
| Realtime / sync پس‌زمینه | DB وجود ندارد | حذف |

### مسیرهای حذف‌شده در React Router
- `/admin/*` (همه صفحات ادمین)
- `/login`, `/signup`, `/reset-password`

### کامپوننت‌ها/هوک‌های حذف یا ساده‌شده
- `AuthContext` → حذف
- `ProtectedRoute` → حذف
- `useChatAssistant` → فقط حالت آفلاین
- `useTranslation` → فقط lookup در snapshot
- `useTextToSpeech` → فقط Web Speech API
- `useBackgroundSync`, `useAutoSync`, `useOfflineDownload`, `useOfflineTest` → حذف
- `OfflineIndicator`, `SyncStatusIndicator`, `DownloadProgressCard` → حذف
- `AdminLayout` و کل `pages/admin/*` → حذف
- `useDataExport`, `useStorageStats`, `useMediaUpload`, `useBackgroundMusic` (قسمت آپلود) → ساده‌سازی

## بخش ۳ — ابزار ادمین آفلاین (Node.js CLI)

برای اینکه ادمین موزه بتواند محتوا را ویرایش کند، یک ابزار خط فرمان کوچک می‌سازیم:

```text
tools/admin-cli/
├── package.json
├── server.mjs          ← Express لوکال روی http://localhost:5174
├── web/                ← یک UI ساده React که فقط روی localhost باز می‌شود
└── README.md
```

**کاربرد:**
1. ادمین روی لپ‌تاپ خودش `npm run admin` می‌زند.
2. مرورگر باز می‌شود روی `http://localhost:5174`.
3. CRUD کامل روی `content/snapshot.json` + آپلود فایل به `content/images/...`.
4. دکمه «Build & Deploy»: اسکریپت `scripts/bundle-content.mjs` را اجرا می‌کند که:
   - فایل‌های `content/*` را به `public/data/`, `public/images/`, `public/videos/` کپی می‌کند
   - تصاویر را با sharp به WebP فشرده می‌کند
   - `npm run build` می‌زند
   - خروجی `build/` را با rsync/scp به کیوسک‌ها push می‌کند

این ابزار **هرگز در محیط کیوسک اجرا نمی‌شود** — فقط روی دستگاه ادمین.

## بخش ۴ — اسکریپت مهاجرت یک‌باره

`scripts/migrate-from-supabase.mjs` (یک‌بار اجرا می‌شود، سپس حذف):
1. به Supabase فعلی وصل می‌شود (با همان anon key موجود).
2. همه جدول‌های public را می‌خواند.
3. همه فایل‌ها را از باکت‌های Storage دانلود می‌کند.
4. URL ها را در snapshot به مسیرهای لوکال (`/images/{hash}.webp`) بازنویسی می‌کند.
5. خروجی نهایی را در `content/snapshot.json` و `content/images/`, `content/videos/`, `content/audio/` ذخیره می‌کند.

پس از اجرا، کل اتصال به Supabase قطع و حذف می‌شود.

## بخش ۵ — استقرار

### کیوسک
- فقط فولدر `build/` روی Nginx یا حتی `python3 -m http.server` کافی است.
- Service Worker فعلی (نسخه v11) همه چیز را precache می‌کند → بعد از اولین بارگذاری، هیچ نیازی به شبکه نیست.
- بدون دیتابیس، بدون پورت باز، بدون فایروال پیچیده.

### Docker (اختیاری، ساده‌تر از قبل)
```yaml
services:
  museum-kiosk:
    image: nginx:alpine
    volumes:
      - ./build:/usr/share/nginx/html:ro
    ports: ["80:80"]
```

## بخش ۶ — مزایای امنیتی

- **صفر surface حمله**: نه دیتابیسی هست که SQL injection شود، نه auth ای که bypass شود، نه API ای که rate-limit ندارد.
- **صفر secret**: نیازی به `JWT_SECRET`, `DB_PASSWORD`, `API_KEY` نیست.
- **CSP سخت‌گیر**: می‌توان `connect-src 'none'` گذاشت چون هیچ درخواست شبکه‌ای انجام نمی‌شود.
- **PWA کاملاً self-contained**: حتی اگر کابل شبکه قطع شود، اپ کامل کار می‌کند.

## مراحل اجرا (به ترتیب)

1. اسکریپت `migrate-from-supabase.mjs` نوشته و یک‌بار اجرا شود → `content/` پر می‌شود.
2. `src/lib/dataStore.ts` ساخته شود.
3. تمام import های `@/lib/supabase` و `@/integrations/supabase/client` در سراسر کد جایگزین شوند با `dataStore`.
4. صفحات/کامپوننت‌های وابسته به سرور حذف شوند (لیست بخش ۲).
5. روت‌های `/admin/*`, `/login`, ... از `App.tsx` و router حذف شوند.
6. `package.json`: حذف `@supabase/supabase-js`, `xlsx` (اگر فقط برای export بود).
7. `.env` و `vite-env.d.ts` پاک‌سازی شوند.
8. فولدر `supabase/` و `src/integrations/supabase/` حذف شوند.
9. `scripts/bundle-content.mjs` بازنویسی شود (به‌جای Supabase، از `content/` بخواند).
10. ابزار `tools/admin-cli/` ساخته شود.
11. `README.md` و `DEPLOYMENT.md` بازنویسی شوند.
12. تست E2E: کیوسک با `--offline` flag مرورگر باز شود و همه صفحات کار کنند.

## ریسک‌ها / نکات

- **تعداد فایل‌های فرانت‌اند که باید تغییر کنند زیاد است** (~30-40 فایل). من گام به گام پیش می‌روم.
- **محتوای ادمین فقط روی دستگاه ادمین قابل ویرایش است** و باید هر بار اپ re-deploy شود به کیوسک‌ها. (این تعادل مناسبی برای موزه است که محتوا کم تغییر می‌کند.)
- **چت AI واقعی از دست می‌رود** — فقط پاسخ‌های ثابت/الگو-محور باقی می‌ماند. اگر این مهم است، بگویید تا گزینه ترکیبی (آفلاین + یک Edge Function اختیاری برای چت) را پلن کنم.
- **Lovable preview**: ابزار ادمین CLI در پیش‌نمایش Lovable اجرا نمی‌شود (نیاز به Node لوکال دارد). در Lovable فقط اپ کیوسک قابل مشاهده است.

اگر تأیید می‌کنید، اجرا را شروع می‌کنم.
