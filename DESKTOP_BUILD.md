# ساخت فایل EXE برای ویندوز با Electron

این راهنما نحوه تبدیل اپلیکیشن وب موزه کشتی ایران به یک برنامه دسکتاپ ویندوز (فایل EXE) را توضیح می‌دهد.

---

## 📋 فهرست مطالب

- [پیش‌نیازها](#پیش‌نیازها)
- [مراحل ساخت با Electron](#مراحل-ساخت-با-electron)
- [ساختار فایل‌ها](#ساختار-فایل‌ها)
- [دستورات Build](#دستورات-build)
- [رفع مشکلات](#رفع-مشکلات)
- [تنظیمات پیشرفته](#تنظیمات-پیشرفته)

---

## پیش‌نیازها

### ۱. نصب Node.js
- دانلود از: https://nodejs.org
- نسخه ۱۸ یا بالاتر

### ۲. سیستم‌عامل
- ویندوز ۱۰ یا ۱۱ (۶۴ بیتی)
- حداقل ۸ گیگابایت RAM (پیشنهادی ۱۶GB)

---

## مراحل ساخت با Electron

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

### مرحله ۴: نصب Electron Dependencies

```bash
npm install --save-dev electron@^28.0.0 electron-builder@^24.9.0 concurrently@^8.2.0 wait-on@^7.2.0
```

### مرحله ۵: اضافه کردن اسکریپت‌ها به package.json

در فایل `package.json` این خطوط را اضافه کنید:

```json
{
  "main": "electron/main.js",
  "scripts": {
    "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:8080 && electron .\"",
    "build-electron": "npm run build && electron-builder --win",
    "build-portable": "npm run build && electron-builder --win portable",
    "build-installer": "npm run build && electron-builder --win nsis"
  }
}
```

### مرحله ۶: ساخت فایل EXE

```bash
# ساخت هر دو نسخه (Installer + Portable)
npm run build-electron

# فقط نسخه Portable
npm run build-portable

# فقط نسخه Installer (NSIS)
npm run build-installer
```

### مرحله ۷: یافتن فایل خروجی

پس از اتمام build، فایل‌ها در پوشه `release/` قرار می‌گیرند:

```
release/
├── موزه کشتی ایران-1.0.0-x64.exe    # نصب‌کننده NSIS
├── موزه کشتی ایران-Portable-1.0.0.exe  # نسخه Portable
└── win-unpacked/                      # پوشه unpacked
```

---

## ساختار فایل‌ها

پروژه شامل فایل‌های Electron زیر است:

```
project/
├── electron/
│   ├── main.js          # فایل اصلی Electron
│   └── preload.js       # Bridge امن
├── electron-builder.config.json  # تنظیمات ساخت
├── public/
│   ├── favicon.png      # آیکون اصلی
│   ├── favicon.ico      # آیکون ICO
│   └── app-icon.png     # آیکون ۵۱۲×۵۱۲
└── KIOSK_README.md      # راهنمای مشتری
```

---

## دستورات Build

| دستور | توضیحات |
|-------|---------|
| `npm run dev` | اجرای وب در حالت توسعه |
| `npm run electron:dev` | اجرای Electron در حالت توسعه |
| `npm run build-electron` | ساخت هر دو نوع EXE |
| `npm run build-portable` | ساخت فقط Portable EXE |
| `npm run build-installer` | ساخت فقط NSIS Installer |

---

## رفع مشکلات

### خطای node-gyp

```bash
npm install -g node-gyp
npm rebuild
```

### خطای Electron download

```bash
# پاک کردن cache
npm cache clean --force
rmdir /s /q node_modules\.cache

# نصب مجدد
npm install
```

### خطای Build در ویندوز

1. Visual Studio Build Tools را نصب کنید
2. PowerShell را به عنوان Admin اجرا کنید:
```powershell
Set-ExecutionPolicy RemoteSigned
```

### فایل EXE باز نمی‌شود

- مطمئن شوید WebView2 Runtime نصب است
- آنتی‌ویروس را موقتاً غیرفعال کنید

---

## تنظیمات پیشرفته

### تغییر آیکون

1. یک فایل PNG با ابعاد ۵۱۲×۵۱۲ آماده کنید
2. با ابزار آنلاین به ICO تبدیل کنید (https://icoconvert.com)
3. فایل را در `public/favicon.ico` قرار دهید

### غیرفعال کردن DevTools

در `electron/main.js`:
```javascript
// خط زیر را حذف یا کامنت کنید:
// mainWindow.webContents.openDevTools();
```

### تغییر میانبر خروج

در `electron/main.js`:
```javascript
// میانبر فعلی: Ctrl+Shift+Q
globalShortcut.register('CommandOrControl+Shift+Q', () => {
  app.quit();
});

// تغییر به میانبر دیگر:
globalShortcut.register('CommandOrControl+Alt+X', () => {
  app.quit();
});
```

### فعال کردن Auto-Update

```bash
npm install electron-updater
```

در `electron/main.js`:
```javascript
const { autoUpdater } = require('electron-updater');

app.whenReady().then(() => {
  autoUpdater.checkForUpdatesAndNotify();
});
```

---

## بسته تحویل به مشتری

پس از build، این فایل‌ها را زیپ کنید:

```
📦 تحویل_موزه_کشتی.zip
├── موزه کشتی ایران-Setup.exe   # نصب‌کننده
├── موزه کشتی ایران-Portable.exe  # Portable
└── راهنما.txt                    # کپی از KIOSK_README.md
```

---

## Tauri (جایگزین)

اگر نیاز به حجم کمتر دارید، می‌توانید از Tauri استفاده کنید:

| ویژگی | Electron | Tauri |
|-------|----------|-------|
| حجم فایل | ~150 MB | ~10-20 MB |
| مصرف RAM | زیاد | کم |
| سازگاری | بالا | متوسط |
| پیچیدگی | کم | متوسط |

برای Tauri، نیاز به نصب Rust دارید. راهنمای کامل در مستندات Tauri موجود است.

---

## منابع

- [مستندات Electron](https://electronjs.org/docs)
- [electron-builder](https://www.electron.build/)
- [electron-updater](https://www.electron.build/auto-update)

---

**نسخه:** 1.0.0  
**تاریخ:** بهمن ۱۴۰۴
