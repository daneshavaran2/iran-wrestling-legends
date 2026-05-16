# Museum API (Node.js + Fastify + SQLite)

جایگزین کامل Supabase برای دیتابیس، احراز هویت ادمین، آپلود فایل، و پروکسی AI.

## اجرا (محلی)

```bash
cd server
npm install
JWT_SECRET=$(openssl rand -hex 32) npm run dev
# → http://localhost:3001
```

## محیط

| متغیر | پیش‌فرض | توضیح |
|---|---|---|
| `PORT` | `3001` | پورت HTTP |
| `HOST` | `0.0.0.0` | bind address |
| `DATA_DIR` | `./data` | محل `db.sqlite` و `uploads/` |
| `JWT_SECRET` | اجباری در production | کلید امضای JWT (>=32 بایت) |
| `JWT_EXPIRES_IN` | `7d` | عمر توکن |
| `CORS_ORIGIN` | `*` | لیست origin مجاز با کاما |
| `LOVABLE_API_KEY` | خالی | برای `/api/ai/chat` |

## Endpointها

- `POST /api/auth/setup` — ساخت اولین ادمین (فقط اگر هیچ ادمینی نباشد)
- `POST /api/auth/login` — `{ email, password }` → `{ token, user }`
- `GET  /api/auth/me` — اطلاعات کاربر فعلی (نیاز به Bearer)
- `GET  /api/snapshot.json` — تمام جداول عمومی برای کش آفلاین
- `GET  /api/{table}` — لیست با فیلتر سبک: `?col.eq=val&order=col.desc&limit=20&offset=0`
- `GET  /api/{table}/:id` — تک رکورد
- `POST /api/{table}` — درج (admin)
- `PATCH /api/{table}/:id` — به‌روزرسانی (admin)
- `PUT /api/{table}/:id` — upsert (admin)
- `DELETE /api/{table}/:id` — حذف (admin)
- `POST /api/uploads` — multipart؛ تصاویر به WebP تبدیل می‌شوند
- `POST /api/ai/chat` — پروکسی Lovable AI Gateway

## مهاجرت یکباره از Supabase

```bash
SUPABASE_URL=https://xxx.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=eyJ... \
DATA_DIR=./data \
node scripts/migrate-from-supabase.mjs
```

اسکریپت تمام جداول و فایل‌های Storage را به `data/db.sqlite` و `data/uploads/` می‌آورد و URLها را به مسیر لوکال بازنویسی می‌کند.

## استقرار (Docker Compose)

در ریشه پروژه:

```bash
JWT_SECRET=$(openssl rand -hex 32) \
LOVABLE_API_KEY=... \
docker compose up -d --build
```

nginx روی پورت `80` فایل‌های ساخته‌شده، `/uploads/*` و پروکسی `/api/*` به سرویس `api` را سرو می‌کند.