

## برنامه جامع: تبدیل BMP به WEBP + Edge Function برای Thumbnail + قابلیت Zoom در FlipBook + بروزرسانی README + آماده‌سازی برای ویندوز

---

### خلاصه اجرایی

این برنامه شامل ۵ بخش اصلی است:
1. تبدیل تصاویر BMP به WEBP
2. ایجاد Edge Function برای تولید خودکار Thumbnail
3. قابلیت Zoom/Pinch در FlipBook
4. بروزرسانی README حرفه‌ای
5. آماده‌سازی Electron برای ویندوز

---

## بخش اول: تبدیل BMP به WEBP

### ۱.۱ بروزرسانی `imageCompressor.ts`

افزودن قابلیت تبدیل BMP به WEBP:

```typescript
// src/utils/imageCompressor.ts

export async function convertToWebP(
  file: File,
  quality: number = 0.85
): Promise<File> {
  // تشخیص BMP
  const isBMP = file.type === 'image/bmp' || 
                file.name.toLowerCase().endsWith('.bmp');
  
  if (!isBMP && !file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(file);
      
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file);
          
          // تغییر نام فایل به .webp
          const newName = file.name.replace(/\.[^.]+$/, '.webp');
          const webpFile = new File([blob], newName, {
            type: 'image/webp',
            lastModified: Date.now(),
          });
          
          resolve(webpFile);
        },
        'image/webp',
        quality
      );
    };
    
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}
```

### ۱.۲ بروزرسانی `useMediaUpload.ts`

اعمال تبدیل خودکار قبل از آپلود:

```typescript
import { convertToWebP, compressImage } from '@/utils/imageCompressor';

const uploadFile = async (file: File, ...args) => {
  // تبدیل BMP به WebP
  let processedFile = await convertToWebP(file);
  // فشرده‌سازی
  processedFile = await compressImage(processedFile);
  
  // ادامه آپلود...
};
```

---

## بخش دوم: Edge Function برای تولید خودکار Thumbnail

### ۲.۱ ایجاد Edge Function جدید

```typescript
// supabase/functions/generate-thumbnail/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, bucket = 'album-media' } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // استفاده از Supabase Image Transform برای تولید thumbnail
    const thumbnailUrl = imageUrl.replace(
      '/storage/v1/object/public/',
      '/storage/v1/render/image/public/'
    ) + '?width=400&quality=60';

    const mediumUrl = imageUrl.replace(
      '/storage/v1/object/public/',
      '/storage/v1/render/image/public/'
    ) + '?width=800&quality=75';

    return new Response(
      JSON.stringify({ 
        original: imageUrl,
        thumbnail: thumbnailUrl,
        medium: mediumUrl
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Thumbnail generation error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

### ۲.۲ بروزرسانی `config.toml`

```toml
[functions.generate-thumbnail]
verify_jwt = false
```

---

## بخش سوم: قابلیت Zoom/Pinch در FlipBook

### ۳.۱ بروزرسانی `FlipBook.tsx`

```typescript
// اضافه کردن state های جدید
const [scale, setScale] = useState(1);
const [position, setPosition] = useState({ x: 0, y: 0 });
const [isDragging, setIsDragging] = useState(false);
const lastPinchDistance = useRef<number | null>(null);

// Pinch to zoom
const handleTouchMove = (e: React.TouchEvent) => {
  if (e.touches.length === 2) {
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    const distance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );
    
    if (lastPinchDistance.current) {
      const delta = distance - lastPinchDistance.current;
      setScale(prev => Math.min(Math.max(prev + delta * 0.01, 1), 3));
    }
    lastPinchDistance.current = distance;
  }
};

// Double-tap to zoom
const handleDoubleClick = () => {
  if (scale > 1) {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  } else {
    setScale(2);
  }
};

// Mouse wheel zoom
const handleWheel = (e: WheelEvent) => {
  e.preventDefault();
  const delta = e.deltaY > 0 ? -0.1 : 0.1;
  setScale(prev => Math.min(Math.max(prev + delta, 1), 3));
};

// رندر تصویر با zoom
<div 
  className="relative overflow-hidden"
  onDoubleClick={handleDoubleClick}
  onWheel={handleWheel}
>
  <img
    src={currentPhoto.url}
    style={{
      transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
      transition: isDragging ? 'none' : 'transform 0.2s',
    }}
  />
  {scale > 1 && (
    <button 
      onClick={() => { setScale(1); setPosition({ x: 0, y: 0 }); }}
      className="absolute top-2 right-2 bg-black/50 p-2 rounded-full"
    >
      <ZoomOut className="h-5 w-5" />
    </button>
  )}
</div>
```

### ۳.۲ افزودن دکمه‌های Zoom به کنترل‌ها

```typescript
// دکمه‌های + و - برای zoom
<div className="flex gap-2">
  <button onClick={() => setScale(s => Math.min(s + 0.5, 3))}>
    <ZoomIn className="h-5 w-5" />
  </button>
  <button onClick={() => setScale(s => Math.max(s - 0.5, 1))}>
    <ZoomOut className="h-5 w-5" />
  </button>
</div>
```

---

## بخش چهارم: README حرفه‌ای

### ۴.۱ بروزرسانی کامل `README.md`

```markdown
# موزه افتخارات کشتی ایران 🏛️

آرشیو دیجیتال جامع قهرمانان و افتخارات کشتی ایران

## 📋 فهرست مطالب
- [معرفی](#معرفی)
- [ویژگی‌ها](#ویژگی‌ها)
- [نصب و راه‌اندازی](#نصب-و-راه‌اندازی)
- [استفاده آفلاین](#استفاده-آفلاین)
- [ساخت نسخه دسکتاپ](#ساخت-نسخه-دسکتاپ)
- [پشتیبانی](#پشتیبانی)

## معرفی

این اپلیکیشن برای نمایش در کیوسک‌های موزه کشتی ایران طراحی شده است.

## ویژگی‌ها

### 🎨 رابط کاربری
- طراحی RTL فارسی
- پشتیبانی از چند زبان (فارسی، انگلیسی، عربی)
- تم روشن/تاریک
- بهینه برای صفحات لمسی 55 اینچی
- استایل Liquid Glass شفاف

### 📸 مدیریت تصاویر
- تبدیل خودکار BMP به WebP
- بارگذاری پیش‌رونده (Progressive Loading)
- بهینه‌سازی خودکار تصاویر
- قابلیت Zoom/Pinch در گالری FlipBook
- تولید خودکار Thumbnail

### 📡 قابلیت آفلاین
- PWA با Service Worker
- کش 24 ساعته داده‌ها
- همگام‌سازی خودکار
- نشانگر وضعیت آفلاین

### 🤖 هوش مصنوعی
- دستیار هوشمند موزه
- ترجمه خودکار محتوا
- Text-to-Speech

### 🎵 چندرسانه‌ای
- موسیقی پس‌زمینه
- گالری FlipBook با اسلایدشو
- پخش‌کننده ویدیو

## نصب و راه‌اندازی

### پیش‌نیازها
- Node.js 18+
- npm یا bun

### مراحل نصب
\`\`\`bash
npm install
npm run dev
\`\`\`

## استفاده آفلاین

اپلیکیشن به صورت PWA کار می‌کند:
- با اینترنت: همه قابلیت‌ها فعال
- بدون اینترنت: نمایش داده‌های کش شده
- بازگشت اینترنت: همگام‌سازی خودکار

## ساخت نسخه دسکتاپ

برای جزئیات بیشتر به فایل `DESKTOP_BUILD.md` مراجعه کنید.

## پشتیبانی

تماس با تیم توسعه از طریق GitHub Issues

---
نسخه: 1.0.0 | تاریخ: بهمن ۱۴۰۴
```

### ۴.۲ ایجاد `KIOSK_README.md` برای مشتری

```markdown
# راهنمای نصب و استفاده - موزه کشتی ایران

## پیش‌نیازها
- ویندوز 10/11 (64-bit)
- حداقل 4GB رم
- WebView2 Runtime

## نصب
1. فایل `setup.exe` را اجرا کنید
2. مراحل نصب را دنبال کنید

## اجرا
- دوبار کلیک روی آیکون برنامه

## رفتار آنلاین/آفلاین

| وضعیت | رفتار |
|-------|-------|
| 🟢 آنلاین | همه قابلیت‌ها، داده‌های زنده |
| 🟡 آفلاین | نمایش آخرین داده‌ها، پیغام آفلاین |
| 🔄 بازگشت | همگام‌سازی خودکار |

## خروج از حالت کیوسک
- کلید میانبر: Ctrl+Shift+Q

## پشتیبانی
تماس: [اطلاعات تماس]
```

---

## بخش پنجم: آماده‌سازی Electron برای ویندوز

### ۵.۱ نصب Dependencies

```json
// package.json - devDependencies
{
  "electron": "^28.0.0",
  "electron-builder": "^24.9.0",
  "concurrently": "^8.2.0"
}
```

### ۵.۲ ایجاد `electron/main.js`

```javascript
const { app, BrowserWindow, globalShortcut } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: true,
    kiosk: true,
    frame: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Production: load dist/index.html
  // Development: load localhost:8080
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:8080');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Disable keyboard shortcuts
  mainWindow.webContents.on('before-input-event', (event, input) => {
    // Block F12, Ctrl+Shift+I, Alt+F4, Esc
    if (
      input.key === 'F12' ||
      (input.control && input.shift && input.key === 'I') ||
      (input.alt && input.key === 'F4') ||
      input.key === 'Escape'
    ) {
      event.preventDefault();
    }
  });

  // Secret exit: Ctrl+Shift+Q
  globalShortcut.register('CommandOrControl+Shift+Q', () => {
    app.quit();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
```

### ۵.۳ ایجاد `electron/preload.js`

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  isElectron: true,
  platform: process.platform,
  onOffline: (callback) => ipcRenderer.on('offline', callback),
  onOnline: (callback) => ipcRenderer.on('online', callback),
});
```

### ۵.۴ ایجاد `electron-builder.config.json`

```json
{
  "appId": "ir.wrestling-museum.app",
  "productName": "موزه کشتی ایران",
  "directories": {
    "output": "release"
  },
  "files": [
    "dist/**/*",
    "electron/**/*"
  ],
  "win": {
    "target": [
      { "target": "nsis", "arch": ["x64"] },
      { "target": "portable", "arch": ["x64"] }
    ],
    "icon": "public/favicon.png"
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "installerLanguages": ["fa", "en"],
    "language": 1065
  },
  "portable": {
    "artifactName": "${productName}-Portable.exe"
  }
}
```

### ۵.۵ بروزرسانی `package.json` Scripts

```json
{
  "scripts": {
    "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:8080 && electron .\"",
    "build-electron": "npm run build && electron-builder --win",
    "build-portable": "npm run build && electron-builder --win portable"
  },
  "main": "electron/main.js"
}
```

---

## خلاصه فایل‌های جدید و تغییرات

| فایل | نوع | توضیحات |
|------|-----|---------|
| `src/utils/imageCompressor.ts` | بروزرسانی | افزودن تبدیل BMP به WebP |
| `src/hooks/useMediaUpload.ts` | بروزرسانی | اعمال تبدیل خودکار |
| `supabase/functions/generate-thumbnail/index.ts` | جدید | Edge Function تولید Thumbnail |
| `supabase/config.toml` | بروزرسانی | افزودن تنظیمات Edge Function |
| `src/components/ui/FlipBook.tsx` | بروزرسانی | قابلیت Zoom/Pinch |
| `README.md` | بروزرسانی | مستندات کامل پروژه |
| `KIOSK_README.md` | جدید | راهنمای مشتری |
| `electron/main.js` | جدید | فایل اصلی Electron |
| `electron/preload.js` | جدید | Bridge امن Electron |
| `electron-builder.config.json` | جدید | تنظیمات ساخت EXE |
| `package.json` | بروزرسانی | اسکریپت‌های Electron |

---

## مراحل Export و تحویل به مشتری

### مرحله ۱: Export کد
```bash
# در Lovable: Export to GitHub
```

### مرحله ۲: Clone و نصب
```bash
git clone https://github.com/YOUR_REPO.git
cd YOUR_REPO
npm install
```

### مرحله ۳: ساخت EXE
```bash
npm run build-electron
```

### مرحله ۴: تهیه بسته تحویل
```
📦 delivery.zip
├── setup.exe              # نصب‌کننده
├── موزه کشتی ایران-Portable.exe  # نسخه Portable
└── README.txt             # راهنمای فارسی
```

---

## نکات مهم

1. **Electron vs Tauri**: با توجه به درخواست شما از Electron استفاده می‌کنیم (پروژه قبلاً راهنمای Tauri دارد)

2. **حالت آفلاین**: سیستم موجود با localStorage و Service Worker کار می‌کند و کاملاً آماده است

3. **کد منبع**: فایل EXE شامل کد منبع نیست، فقط bundle شده Vite + Electron

4. **آیکون**: از `public/favicon.png` موجود استفاده می‌شود

