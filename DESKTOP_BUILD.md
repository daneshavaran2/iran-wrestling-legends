# ساخت فایل EXE برای ویندوز با Tauri

این راهنما نحوه تبدیل اپلیکیشن وب موزه کشتی ایران به یک برنامه دسکتاپ ویندوز (فایل EXE) را توضیح می‌دهد.

## مزایای Tauri نسبت به Electron

| ویژگی | Tauri | Electron |
|-------|-------|----------|
| حجم فایل | ~10-20 MB | ~150+ MB |
| مصرف حافظه | کم | زیاد |
| سرعت | بسیار سریع | متوسط |
| امنیت | بالا | متوسط |

---

## پیش‌نیازها

### ۱. نصب Node.js
- دانلود از: https://nodejs.org
- نسخه ۱۸ یا بالاتر

### ۲. نصب Rust
- دانلود از: https://rustup.rs
- پس از نصب، ترمینال را ببندید و دوباره باز کنید

### ۳. نصب Visual Studio Build Tools (ویندوز)
- دانلود از: https://visualstudio.microsoft.com/visual-cpp-build-tools/
- در نصب، گزینه "Desktop development with C++" را انتخاب کنید

---

## مراحل ساخت

### مرحله ۱: انتقال پروژه به GitHub

در Lovable:
1. روی دکمه **"Export to GitHub"** کلیک کنید
2. یک repository جدید ایجاد کنید

### مرحله ۲: Clone پروژه

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
```

### مرحله ۳: نصب Dependencies

```bash
npm install
```

### مرحله ۴: نصب Tauri CLI

```bash
npm install -D @tauri-apps/cli@latest @tauri-apps/api@latest
```

### مرحله ۵: راه‌اندازی Tauri

```bash
npx tauri init
```

در پاسخ به سوالات:
- **App name:** `موزه کشتی ایران`
- **Window title:** `موزه افتخارات کشتی ایران`
- **Frontend dev URL:** `http://localhost:8080`
- **Frontend dist:** `../dist`
- **Dev command:** `npm run dev`
- **Build command:** `npm run build`

### مرحله ۶: تنظیمات Tauri

فایل `src-tauri/tauri.conf.json` را ویرایش کنید:

```json
{
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devUrl": "http://localhost:8080",
    "frontendDist": "../dist"
  },
  "bundle": {
    "active": true,
    "targets": ["nsis", "msi"],
    "icon": ["icons/32x32.png", "icons/128x128.png", "icons/icon.ico"],
    "identifier": "ir.wrestling-museum.app",
    "windows": {
      "wix": {
        "language": ["fa-IR", "en-US"]
      }
    }
  },
  "app": {
    "windows": [
      {
        "title": "موزه افتخارات کشتی ایران",
        "width": 1280,
        "height": 800,
        "resizable": true,
        "fullscreen": false,
        "center": true
      }
    ]
  }
}
```

### مرحله ۷: اضافه کردن آیکون

1. آیکون‌های مورد نیاز را در `src-tauri/icons/` قرار دهید:
   - `icon.ico` (برای ویندوز)
   - `32x32.png`
   - `128x128.png`
   - `128x128@2x.png`

2. یا از ابزار Tauri برای تولید آیکون استفاده کنید:
```bash
npx tauri icon path/to/your/icon.png
```

### مرحله ۸: ساخت فایل EXE

```bash
npm run tauri build
```

### مرحله ۹: یافتن فایل خروجی

پس از اتمام build، فایل‌های نصب در این مسیر قرار می‌گیرند:

```
src-tauri/target/release/bundle/
├── nsis/
│   └── موزه کشتی ایران_x.x.x_x64-setup.exe  # نصب‌کننده NSIS
└── msi/
    └── موزه کشتی ایران_x.x.x_x64.msi        # نصب‌کننده MSI
```

---

## اجرای حالت توسعه

برای تست برنامه قبل از build:

```bash
npm run tauri dev
```

---

## رفع مشکلات رایج

### خطای WebView2
اگر خطای WebView2 دریافت کردید:
- WebView2 Runtime را از سایت مایکروسافت دانلود و نصب کنید
- یا در `tauri.conf.json` گزینه `embedWebview2` را `true` کنید

### خطای Rust
```bash
rustup update
```

### خطای Build
```bash
npm run build
npx tauri build --verbose
```

---

## تنظیمات پیشرفته

### فعال کردن Auto-Update

در `tauri.conf.json`:

```json
{
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": ["https://your-update-server.com/check"],
      "pubkey": "YOUR_PUBLIC_KEY"
    }
  }
}
```

### غیرفعال کردن DevTools در Production

در `tauri.conf.json`:

```json
{
  "app": {
    "withDevtools": false
  }
}
```

---

## منابع

- [مستندات Tauri](https://tauri.app/v1/guides/)
- [راهنمای Windows Bundle](https://tauri.app/v1/guides/building/windows)
- [Tauri GitHub](https://github.com/tauri-apps/tauri)

---

## نیاز به کمک؟

اگر در هر مرحله با مشکل مواجه شدید، می‌توانید از طریق GitHub Issues پروژه سوال خود را مطرح کنید.
