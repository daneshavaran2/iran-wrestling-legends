

# افزودن CI/CD با GitHub Actions و Docker Compose

## خلاصه
این برنامه شامل ایجاد سیستم CI/CD خودکار با GitHub Actions و فایل docker-compose برای اجرای ساده‌تر با Docker است.

---

## ۱. فایل‌های GitHub Actions

### `.github/workflows/ci.yml` - تست و بررسی کد
این فایل هنگام هر push یا pull request اجرا می‌شود:

```text
┌─────────────────────────────────────────────────┐
│  Trigger: Push / Pull Request                   │
├─────────────────────────────────────────────────┤
│  1. Checkout کد                                 │
│  2. نصب Node.js 18                              │
│  3. نصب dependencies (npm ci)                   │
│  4. اجرای TypeScript type-check                 │
│  5. اجرای ESLint                                │
│  6. Build پروژه                                 │
└─────────────────────────────────────────────────┘
```

### `.github/workflows/deploy.yml` - Deploy خودکار
این فایل فقط هنگام push به branch اصلی اجرا می‌شود:

```text
┌─────────────────────────────────────────────────┐
│  Trigger: Push to main/master                   │
├─────────────────────────────────────────────────┤
│  1. Build پروژه                                 │
│  2. آپلود artifact                              │
│  3. Deploy به سرور (اختیاری)                   │
│     - SSH Deploy                                │
│     - Docker Registry                           │
│     - GitHub Pages                              │
└─────────────────────────────────────────────────┘
```

---

## ۲. فایل‌های Docker

### `Dockerfile` - ساخت image
یک فایل Dockerfile بهینه‌شده multi-stage برای production:

```text
┌──────────────────────────────────────┐
│  Stage 1: Builder                    │
│  - Node.js 18 Alpine                 │
│  - npm ci                            │
│  - npm run build                     │
├──────────────────────────────────────┤
│  Stage 2: Production                 │
│  - Nginx Alpine                      │
│  - کپی فایل‌های build                │
│  - تنظیمات nginx برای SPA           │
└──────────────────────────────────────┘
```

### `docker-compose.yml` - اجرای ساده
امکان اجرا با یک دستور ساده:

```bash
docker-compose up -d
```

شامل:
- سرویس اصلی museum
- پورت 80
- Restart policy: unless-stopped
- Health check

### `docker-compose.dev.yml` - محیط توسعه
برای توسعه محلی با hot-reload:

```bash
docker-compose -f docker-compose.dev.yml up
```

---

## ۳. فایل `nginx.conf`
تنظیمات بهینه Nginx شامل:
- SPA fallback به index.html
- Gzip compression
- کش فایل‌های static
- Security headers

---

## ۴. فایل `.dockerignore`
برای کاهش حجم image و سرعت بالاتر build

---

## ۵. آپدیت مستندات
بروزرسانی `DEPLOYMENT.md` با دستورالعمل‌های جدید

---

## لیست فایل‌های ایجادی

| فایل | توضیح |
|------|-------|
| `.github/workflows/ci.yml` | تست و lint خودکار |
| `.github/workflows/deploy.yml` | Deploy خودکار |
| `Dockerfile` | ساخت image production |
| `docker-compose.yml` | اجرای production |
| `docker-compose.dev.yml` | اجرای development |
| `nginx.conf` | تنظیمات Nginx |
| `.dockerignore` | فایل‌های ignore برای Docker |

---

## بخش فنی

### GitHub Secrets مورد نیاز (اختیاری)
برای فعال‌سازی deploy خودکار به سرور:
- `SSH_HOST` - آدرس سرور
- `SSH_USER` - نام کاربری
- `SSH_KEY` - کلید خصوصی SSH
- `SSH_PATH` - مسیر deploy روی سرور

### دستورات Docker

```bash
# اجرای production
docker-compose up -d

# اجرای development
docker-compose -f docker-compose.dev.yml up

# ساخت image دستی
docker build -t wrestling-museum:latest .

# مشاهده لاگ‌ها
docker-compose logs -f
```

### ساختار نهایی

```text
project/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── Dockerfile
├── docker-compose.yml
├── docker-compose.dev.yml
├── nginx.conf
├── .dockerignore
└── DEPLOYMENT.md (آپدیت شده)
```

