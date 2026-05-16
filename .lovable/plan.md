# پلن: مهاجرت بک‌اند از Supabase به Node.js

## معماری نهایی

```text
┌─────────────────────────────────────────────────┐
│           Docker Compose (سرور کیوسک)            │
│                                                 │
│  ┌──────────────┐         ┌──────────────────┐  │
│  │   nginx:80   │ ──────► │   api:3001       │  │
│  │  (static     │  /api/* │ Fastify + TS     │  │
│  │   فرانت)     │         │ better-sqlite3   │  │
│  │              │         │ /data/db.sqlite  │  │
│  └──────────────┘         │ /data/uploads/   │  │
│         ▲                 └──────────────────┘  │
│         │ سرو فایل‌های build/ و آپلودها           │
└─────────│───────────────────────────────────────┘
          │
       مرورگر کیوسک (PWA، آفلاین کامل)
```

- یک volume مشترک `/data` بین nginx و api: شامل `db.sqlite` + پوشه `uploads/`.
- nginx فایل‌های `uploads/*` را مستقیم سرو می‌کند (بدون عبور از Node).
- درخواست‌های `/api/*` به سرویس `api` پروکسی می‌شوند.

## ساختار پوشه‌ها

```text
server/
├── package.json
├── tsconfig.json
├── Dockerfile
├── src/
│   ├── index.ts              # bootstrap Fastify
│   ├── db.ts                 # better-sqlite3 + migrations
│   ├── auth.ts               # JWT + bcrypt
│   ├── env.ts                # بارگذاری متغیرها
│   ├── middleware/
│   │   ├── requireAdmin.ts
│   │   └── errorHandler.ts
│   ├── routes/
│   │   ├── auth.ts           # /api/auth/login, /me, /setup
│   │   ├── wrestlers.ts      # CRUD + wrestler_media + achievements
│   │   ├── albums.ts         # CRUD + album_photos
│   │   ├── history.ts        # history_sections + history_media
│   │   ├── buildings.ts      # buildings + building_images
│   │   ├── books.ts
│   │   ├── about.ts          # about_media
│   │   ├── settings.ts       # app_settings
│   │   ├── translations.ts
│   │   ├── uploads.ts        # POST فایل، WebP compress
│   │   ├── snapshot.ts       # GET /api/snapshot.json
│   │   └── ai.ts             # پروکسی Lovable AI Gateway (آماده برای آینده)
│   └── migrations/
│       └── 001_init.sql      # تمام جداول معادل Supabase
└── data/                     # mount در Docker (gitignore)
    ├── db.sqlite
    └── uploads/{wrestlers,albums,buildings,about,audio}/
```

## نگاشت جداول → SQLite

تمام ۱۲ جدول Supabase به SQLite منتقل می‌شوند با همان ستون‌ها و معانی:

- `wrestlers`, `wrestler_media`, `achievements`
- `albums`, `album_photos`
- `history_sections`, `history_media`
- `buildings`, `building_images`
- `books`, `about_media`, `app_settings`
- `translations`, `users` (جایگزین `user_roles` — فقط نقش admin)

تغییرات معادل‌سازی:
- `uuid` → `TEXT` با `crypto.randomUUID()` در زمان insert
- `timestamp with time zone` → `TEXT` ISO-8601
- enumها (`medal_type`, `wrestling_style`, `media_type`) → `TEXT` با CHECK
- `boolean` → `INTEGER 0/1`

## API Endpointها

استاندارد REST، تمام پاسخ‌ها JSON با فرمت `{ data, error }` تا shim فعلی فرانت با کمترین تغییر کار کند.

```text
POST   /api/auth/setup           # ایجاد اولین ادمین (اگر هیچ ادمینی نیست)
POST   /api/auth/login           # → { token, user }
GET    /api/auth/me              # نیاز به JWT

GET    /api/snapshot.json        # تمام داده‌های عمومی برای کش آفلاین

GET    /api/wrestlers
GET    /api/wrestlers/:id
POST   /api/wrestlers            # admin
PATCH  /api/wrestlers/:id        # admin
DELETE /api/wrestlers/:id        # admin
GET    /api/wrestlers/:id/media
GET    /api/wrestlers/:id/achievements

# الگوی مشابه برای: albums, history, buildings, books, about, settings, translations

POST   /api/uploads              # admin، multipart → WebP → /data/uploads/...
                                 # ← { url: "/uploads/wrestlers/abc.webp" }
```

JWT با `jsonwebtoken`، رمز با `bcryptjs`، اعتبار ۷ روز، ذخیره در `localStorage` فرانت.

## تغییرات فرانت

هدف: **کمترین تغییر ممکن**. shim فعلی `src/lib/supabase.ts` (که الان از snapshot لوکال می‌خواند) به یک کلاینت HTTP کوچک ارتقا می‌یابد:

1. **`src/lib/apiClient.ts` (جدید)** — `fetch` کوچک با base URL، header JWT، خطاهای یکپارچه.
2. **`src/lib/supabase.ts`** — `QueryBuilder` بازنویسی می‌شود تا به‌جای فیلتر in-memory روی snapshot، به `/api/{table}` با query stringها (`?eq.col=val&order=col.asc&limit=N`) درخواست بزند. شکل پاسخ `{ data, error }` بدون تغییر می‌ماند، پس تمام `.from().select().eq()` های موجود کار می‌کنند.
3. **`auth`**: استابِ همیشه-خروج جای خود را به فراخوانی `/api/auth/*` می‌دهد. `AuthContext`, `ProtectedRoute`, و صفحات `/admin/*` که در گام قبل حذف شده بودند، بازگردانده می‌شوند.
4. **`storage.from().upload()`**: به `POST /api/uploads` رد می‌شود و `getPublicUrl` همان مسیر `/uploads/...` را برمی‌گرداند.
5. **آفلاین‌بودن**: `GET /api/snapshot.json` در سرویس‌ورکر کش می‌شود (مثل گذشته). در حالت آفلاین، `QueryBuilder` به fallback لوکال (snapshot کش‌شده) برمی‌گردد — همان منطق امروز.
6. **متغیر محیطی**: `VITE_API_BASE_URL` (پیش‌فرض `/api` در پروداکشن، `http://localhost:3001/api` در dev). فایل‌های `VITE_SUPABASE_*` و `src/integrations/supabase/*` حذف می‌شوند.

## آپلود و رسانه‌ها

- `multipart` با `@fastify/multipart`.
- تصاویر → تبدیل به WebP با `sharp` (کیفیت ۸۲، حداکثر عرض ۲۰۰۰px) → ذخیره در `/data/uploads/{category}/{uuid}.webp`.
- ویدیو/صوت → ذخیره بدون تبدیل، فقط whitelist پسوند.
- nginx مستقیماً `/uploads/*` را با cache header طولانی سرو می‌کند.

## Docker

- **`server/Dockerfile`**: multi-stage (`node:20-alpine` → `node:20-alpine` فقط با `dist/` و `node_modules` پروداکشن). دستور: `node dist/index.js`. پورت `3001`.
- **`docker-compose.yml`** (بروزرسانی):
  ```yaml
  services:
    api:
      build: ./server
      volumes: ['./data:/data']
      environment:
        - JWT_SECRET=${JWT_SECRET}
        - LOVABLE_API_KEY=${LOVABLE_API_KEY}
      ports: ['3001:3001']
    web:
      build: .                 # Dockerfile فعلی Vite + nginx
      volumes: ['./data/uploads:/usr/share/nginx/html/uploads:ro']
      ports: ['80:80']
      depends_on: [api]
  ```
- **`nginx.conf`**: اضافه شدن `location /api/ { proxy_pass http://api:3001/; }` و `location /uploads/ { ... }`.

## مهاجرت داده

اسکریپت یکباره `server/scripts/migrate-from-supabase.mjs`:
1. با `@supabase/supabase-js` و service role تمام جداول را می‌خواند.
2. تمام فایل‌های ۴ بانکت Storage را دانلود و در `/data/uploads/...` ذخیره می‌کند.
3. URLهای Supabase داخل ستون‌ها را با مسیر لوکال جایگزین می‌کند.
4. در SQLite insert می‌کند.
اجرا فقط یک‌بار روی ماشین ادمین، خروجی commit نمی‌شود.

## امنیت

- `helmet` + `@fastify/cors` (فقط origin کیوسک)
- rate limit با `@fastify/rate-limit` روی `/api/auth/login`
- bcrypt با salt rounds=۱۲
- JWT secret اجباری از env، شکست در صورت نبود
- تمام نوشتن‌ها نیازمند `requireAdmin` middleware
- زیر `/data/` خارج از مسیر static فرانت، فقط `/uploads/` افشا می‌شود

## گام‌های پیاده‌سازی (ترتیب اجرا)

1. ساختار `server/` با Fastify + TS + better-sqlite3 + migration اولیه
2. روت‌های auth + middleware admin
3. روت‌های CRUD برای ۱۲ جدول + endpoint snapshot
4. روت آپلود با sharp/WebP
5. بازنویسی `src/lib/supabase.ts` به HTTP client (حفظ API)
6. بازگرداندن `AuthContext`, `ProtectedRoute`, صفحات `/admin/*`
7. به‌روزرسانی `Dockerfile`, `docker-compose.yml`, `nginx.conf`
8. اسکریپت `migrate-from-supabase.mjs`
9. حذف `@supabase/supabase-js`, `src/integrations/supabase/*`, متغیرهای `VITE_SUPABASE_*`
10. به‌روزرسانی `README.md` و `DEPLOYMENT.md`

## ریسک‌ها

- نوع‌های `Database` فعلی از `src/integrations/supabase/types.ts` در جاهای زیادی استفاده می‌شوند — یک فایل `src/types/db.ts` جایگزین می‌سازیم با همان شکل.
- پیش‌نمایش Lovable نمی‌تواند سرویس Node را اجرا کند؛ توسعه و تست واقعی روی ماشین لوکال یا کیوسک انجام می‌شود. در پیش‌نمایش، اگر `VITE_API_BASE_URL` ست نشود، fallback به snapshot لوکال فعال می‌ماند.
- snapshot.json حالا از API می‌آید؛ اسکریپت `scripts/bundle-content.mjs` همچنان برای حالت کاملاً آفلاین در دسترس می‌ماند (اختیاری).
