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

## 🚀 روش‌های استقرار

### روش ۱: Static Hosting (ساده‌ترین)

```bash
# 1. Clone پروژه
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO

# 2. نصب dependencies
npm install

# 3. Build برای production
npm run build

# 4. آپلود محتوای پوشه dist/ روی سرور
```

فایل‌های `dist/` را در root وب‌سرور قرار دهید.

**تنظیمات Nginx:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/museum/dist;
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

### روش ۲: Docker

**Dockerfile:**
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf:**
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**اجرا:**
```bash
# Build image
docker build -t wrestling-museum .

# Run container
docker run -d -p 80:80 --name museum wrestling-museum
```

---

### روش ۳: PM2 + Node.js

```bash
# 1. نصب PM2
npm install -g pm2

# 2. Build
npm run build

# 3. نصب serve
npm install -g serve

# 4. اجرا با PM2
pm2 start "serve -s dist -l 80" --name museum

# 5. ذخیره برای اجرای خودکار
pm2 save
pm2 startup
```

---

### روش ۴: Liara (ایران)

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
ج: فقط `git pull && npm run build` و جایگزینی فایل‌های dist/

---

## 🆘 پشتیبانی

در صورت مشکل، یک Issue در GitHub ایجاد کنید.

---

*آخرین بروزرسانی: بهمن ۱۴۰۴*
