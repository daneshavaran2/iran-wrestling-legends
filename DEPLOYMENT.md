# راهنمای استقرار روی سرور مستقل
# Deployment Guide for Independent Servers

این راهنما نحوه انتقال و اجرای اپلیکیشن موزه کشتی ایران روی سرورهای مستقل را توضیح می‌دهد.

---

## 📋 پیش‌نیازها

### برای Static Hosting:
- هر وب‌سرور (Apache, Nginx, IIS, ...)
- یا: Node.js 18+ برای build

### برای Docker:
- Docker Engine
- Docker Compose (اختیاری)

---

## 🔄 نکته مهم: داده‌ها

**همه داده‌ها در Supabase Cloud ذخیره شده‌اند:**
- ✅ اطلاعات کشتی‌گیران، آلبوم‌ها، تاریخچه
- ✅ تصاویر و ویدیوها (Storage)
- ✅ تنظیمات اپلیکیشن
- ✅ احراز هویت کاربران

**نتیجه:** فقط کد frontend نیاز به deploy دارد. داده‌ها اتوماتیک از Cloud بارگذاری می‌شوند.

---

## 🤖 GitHub Actions (CI/CD خودکار)

پروژه شامل دو workflow از پیش تنظیم شده است:

### CI - تست و بررسی کد
فایل: `.github/workflows/ci.yml`

هنگام هر push یا pull request اجرا می‌شود:
- ✅ TypeScript type-check
- ✅ ESLint
- ✅ Build پروژه
- ✅ آپلود artifact

### Deploy - استقرار خودکار
فایل: `.github/workflows/deploy.yml`

هنگام push به branch اصلی:
- ✅ Build پروژه
- ✅ آپلود artifact
- ⚙️ Deploy به سرور (نیاز به تنظیم secrets)

### تنظیم GitHub Secrets (اختیاری)

برای فعال‌سازی deploy خودکار به سرور، در Settings → Secrets:

| Secret | توضیح |
|--------|-------|
| `SSH_HOST` | آدرس سرور (مثال: `192.168.1.100`) |
| `SSH_USER` | نام کاربری SSH |
| `SSH_KEY` | کلید خصوصی SSH |
| `SSH_PATH` | مسیر deploy (مثال: `/var/www/museum`) |

برای Docker Registry:
| Secret | توضیح |
|--------|-------|
| `DOCKER_USERNAME` | نام کاربری Docker Hub |
| `DOCKER_PASSWORD` | رمز عبور Docker Hub |

---

## 🐳 Docker Compose (ساده‌ترین روش)

### اجرای Production

```bash
# Clone پروژه
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO

# اجرا با یک دستور
docker-compose up -d

# مشاهده لاگ‌ها
docker-compose logs -f

# متوقف کردن
docker-compose down
```

سایت روی پورت `80` در دسترس خواهد بود.

### اجرای Development (با hot-reload)

```bash
docker-compose -f docker-compose.dev.yml up
```

سایت روی پورت `8080` در دسترس خواهد بود.

### دستورات مفید Docker

```bash
# ساخت image دستی
docker build -t wrestling-museum:latest .

# اجرای container
docker run -d -p 80:80 --name museum wrestling-museum

# مشاهده وضعیت
docker ps

# ورود به container
docker exec -it wrestling-museum sh

# حذف container و image
docker-compose down --rmi all
```

---

## 🚀 روش‌های دیگر استقرار

### روش ۱: Static Hosting (بدون Docker)

```bash
# 1. Clone پروژه
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO

# 2. نصب dependencies
npm install

# 3. Build برای production
npm run build

# 4. آپلود محتوای پوشه build/ روی سرور
```

فایل‌های `build/` را در root وب‌سرور قرار دهید.

**یا از اسکریپت خودکار استفاده کنید:**
```bash
# Linux/macOS
chmod +x scripts/deploy.sh
./scripts/deploy.sh

# Windows PowerShell
.\scripts\deploy.ps1
```

**تنظیمات Nginx:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/museum/build;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**تنظیمات Apache (.htaccess):**
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>
```

---

### روش ۲: PM2 + Node.js

```bash
# 1. نصب PM2
npm install -g pm2

# 2. Build
npm run build

# 3. نصب serve
npm install -g serve

# 4. اجرا با PM2
pm2 start "serve -s build -l 80" --name museum

# 5. ذخیره برای اجرای خودکار
pm2 save
pm2 startup
```

---

### روش ۳: Liara (ایران)

```bash
# 1. نصب Liara CLI
npm install -g @liara/cli

# 2. Login
liara login

# 3. ایجاد فایل liara.json
cat > liara.json << EOF
{
  "platform": "static",
  "app": "wrestling-museum"
}
EOF

# 4. Deploy
liara deploy
```

---

## 🔧 تنظیمات اختیاری

### متغیرهای محیطی

این متغیرها در کد hardcode شده‌اند و نیازی به تنظیم ندارند:
- `VITE_SUPABASE_URL` → از پیش تنظیم شده
- `VITE_SUPABASE_PUBLISHABLE_KEY` → از پیش تنظیم شده

### فعال‌سازی HTTPS

برای production حتماً HTTPS فعال کنید:

**با Certbot (رایگان):**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 📡 رفتار آنلاین/آفلاین

| وضعیت | رفتار |
|-------|-------|
| 🟢 آنلاین | همه قابلیت‌ها فعال، داده‌های زنده |
| 🟡 آفلاین | نمایش داده‌های کش شده (24 ساعت) |
| 🔄 بازگشت آنلاین | همگام‌سازی خودکار |

---

## 💾 پشتیبان‌گیری

از پنل ادمین اپلیکیشن:
1. ورود به پنل ادمین
2. رفتن به بخش "پشتیبان‌گیری"
3. دانلود فایل JSON + تصاویر

---

## ❓ سوالات متداول

**س: آیا نیاز به دیتابیس جداگانه دارم؟**
ج: خیر. همه داده‌ها در Supabase Cloud ذخیره شده‌اند.

**س: آیا تصاویر هم منتقل می‌شوند؟**
ج: تصاویر از Supabase Storage سرو می‌شوند. نیازی به انتقال نیست.

**س: اگر اینترنت قطع شود چه می‌شود؟**
ج: اپلیکیشن از داده‌های کش شده استفاده می‌کند.

**س: چگونه آپدیت کنم؟**
ج: فقط `git pull && npm run build` و جایگزینی فایل‌های build/

**س: چگونه Docker آپدیت کنم؟**
ج: `git pull && docker-compose up -d --build`

---

## 🆘 پشتیبانی

در صورت مشکل، یک Issue در GitHub ایجاد کنید.

---

*آخرین بروزرسانی: بهمن ۱۴۰۴*