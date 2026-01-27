
## برنامه جامع: Splash Screen، Auto-Update، بهینه‌سازی سرعت پاسخگویی دستیار، و آماده‌سازی برای سرور مستقل

---

### خلاصه اجرایی

این برنامه شامل ۵ بخش اصلی است:
1. Splash Screen زیبا با انیمیشن برای Electron
2. قابلیت Auto-Update برای دریافت آپدیت‌های خودکار
3. افزایش سرعت پاسخگویی دستیار هوش مصنوعی
4. آماده‌سازی برای انتقال به سرور مستقل
5. اضافه کردن اسکریپت‌های Electron به package.json

---

## بخش اول: Splash Screen برای Electron

### ۱.۱ بروزرسانی `electron/main.js`

افزودن Splash Window قبل از لود اپلیکیشن اصلی:

```javascript
// electron/main.js - اضافات

let splashWindow;

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 500,
    height: 400,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    center: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
}

function createWindow() {
  // ابتدا splash را نشان بده
  createSplashWindow();
  
  // ... کد فعلی createWindow ...
  
  // وقتی main window آماده شد
  mainWindow.webContents.on('did-finish-load', () => {
    // صبر کن splash حداقل 2 ثانیه نمایش داده شود
    setTimeout(() => {
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
      }
      mainWindow.show();
    }, 2000);
  });
  
  // mainWindow را hidden شروع کن
  mainWindow.hide();
}
```

### ۱.۲ ایجاد `electron/splash.html`

```html
<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      width: 500px;
      height: 400px;
      background: radial-gradient(ellipse at center, #1a1a1a 0%, #0a0a0a 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: 'Vazirmatn', 'Segoe UI', sans-serif;
      color: white;
      overflow: hidden;
      border-radius: 20px;
    }
    
    .glow {
      position: absolute;
      width: 300px;
      height: 300px;
      background: radial-gradient(circle, rgba(205, 127, 50, 0.3) 0%, transparent 70%);
      animation: pulse 2s ease-in-out infinite;
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 0.5; }
      50% { transform: scale(1.2); opacity: 0.8; }
    }
    
    .logo-container {
      position: relative;
      z-index: 10;
      margin-bottom: 30px;
    }
    
    .logo {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      border: 3px solid rgba(205, 127, 50, 0.5);
      box-shadow: 0 0 30px rgba(205, 127, 50, 0.4);
      animation: float 3s ease-in-out infinite;
    }
    
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    
    h1 {
      color: #cd7f32;
      font-size: 24px;
      margin-bottom: 10px;
      text-shadow: 0 0 20px rgba(205, 127, 50, 0.5);
    }
    
    p {
      color: #888;
      font-size: 14px;
      margin-bottom: 30px;
    }
    
    .progress-container {
      width: 200px;
      height: 4px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 2px;
      overflow: hidden;
    }
    
    .progress-bar {
      width: 0%;
      height: 100%;
      background: linear-gradient(90deg, #cd7f32, #ff8c00);
      animation: loading 2s ease-in-out forwards;
    }
    
    @keyframes loading {
      0% { width: 0%; }
      100% { width: 100%; }
    }
    
    .loading-text {
      margin-top: 15px;
      font-size: 12px;
      color: #666;
    }
    
    /* Particles */
    .particles {
      position: absolute;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }
    
    .particle {
      position: absolute;
      width: 4px;
      height: 4px;
      background: #cd7f32;
      border-radius: 50%;
      animation: sparkle 3s infinite;
    }
  </style>
</head>
<body>
  <div class="glow"></div>
  
  <div class="particles">
    <script>
      // Generate random particles
      for (let i = 0; i < 15; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 3 + 's';
        particle.style.opacity = Math.random() * 0.5 + 0.3;
        document.querySelector('.particles').appendChild(particle);
      }
    </script>
  </div>
  
  <div class="logo-container">
    <img src="../public/app-icon.png" alt="Logo" class="logo">
  </div>
  
  <h1>موزه افتخارات کشتی ایران</h1>
  <p>Iran Wrestling Museum</p>
  
  <div class="progress-container">
    <div class="progress-bar"></div>
  </div>
  
  <div class="loading-text">در حال بارگذاری...</div>
</body>
</html>
```

---

## بخش دوم: Auto-Update برای Electron

### ۲.۱ بروزرسانی `electron/main.js`

```javascript
// electron/main.js - اضافات Auto-Update

const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

// تنظیم لاگ
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

// غیرفعال کردن دانلود خودکار
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

// رویدادهای Auto-Update
autoUpdater.on('checking-for-update', () => {
  log.info('Checking for updates...');
  sendStatusToWindow('در حال بررسی آپدیت...');
});

autoUpdater.on('update-available', (info) => {
  log.info('Update available:', info.version);
  sendStatusToWindow(`آپدیت جدید موجود است: ${info.version}`);
  
  // نمایش دیالوگ به کاربر
  const { dialog } = require('electron');
  dialog.showMessageBox({
    type: 'info',
    title: 'آپدیت جدید',
    message: `نسخه جدید ${info.version} موجود است. آیا می‌خواهید دانلود کنید؟`,
    buttons: ['بله', 'بعداً'],
    defaultId: 0,
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.downloadUpdate();
    }
  });
});

autoUpdater.on('update-not-available', () => {
  log.info('No update available');
});

autoUpdater.on('download-progress', (progressObj) => {
  const percent = Math.round(progressObj.percent);
  sendStatusToWindow(`دانلود آپدیت: ${percent}%`);
});

autoUpdater.on('update-downloaded', () => {
  log.info('Update downloaded');
  
  const { dialog } = require('electron');
  dialog.showMessageBox({
    type: 'info',
    title: 'آپدیت آماده',
    message: 'آپدیت دانلود شد. برنامه باید ریستارت شود.',
    buttons: ['ریستارت'],
  }).then(() => {
    autoUpdater.quitAndInstall();
  });
});

autoUpdater.on('error', (err) => {
  log.error('Auto-updater error:', err);
});

function sendStatusToWindow(text) {
  if (mainWindow) {
    mainWindow.webContents.send('update-status', text);
  }
}

// بررسی آپدیت بعد از 5 ثانیه از شروع برنامه
app.whenReady().then(() => {
  createWindow();
  
  setTimeout(() => {
    autoUpdater.checkForUpdates();
  }, 5000);
  
  // بررسی هر 4 ساعت
  setInterval(() => {
    autoUpdater.checkForUpdates();
  }, 4 * 60 * 60 * 1000);
});
```

### ۲.۲ بروزرسانی `electron-builder.config.json`

```json
{
  "publish": {
    "provider": "github",
    "owner": "YOUR_GITHUB_USERNAME",
    "repo": "YOUR_REPO_NAME"
  }
}
```

### ۲.۳ افزودن Dependencies

```json
// package.json - devDependencies
{
  "electron-updater": "^6.1.7",
  "electron-log": "^5.1.1"
}
```

---

## بخش سوم: افزایش سرعت پاسخگویی دستیار (۲ برابر)

### ۳.۱ استفاده از Streaming در Edge Function

```typescript
// supabase/functions/museum-assistant/index.ts - بروزرسانی کامل

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const getSystemPrompt = (language: string) => {
  // ... همان کد قبلی ...
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, language = 'fa', stream = true } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = getSystemPrompt(language);

    // استفاده از مدل سریع‌تر + streaming
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite", // سریع‌ترین مدل
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: stream,
        max_tokens: 500, // محدود کردن طول پاسخ
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      // ... error handling قبلی ...
    }

    if (stream) {
      // Streaming response
      return new Response(response.body, {
        headers: { 
          ...corsHeaders, 
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
        },
      });
    } else {
      // Non-streaming
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "متأسفانه پاسخی دریافت نشد.";
      return new Response(
        JSON.stringify({ content }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error) {
    // ... error handling ...
  }
});
```

### ۳.۲ بروزرسانی `useChatAssistant.ts` برای Streaming

```typescript
// src/hooks/useChatAssistant.ts - پشتیبانی از Streaming

export const useChatAssistant = (): UseChatAssistantReturn => {
  // ... کد قبلی ...

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/museum-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          language,
          stream: true,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to get response');
      }

      // Streaming read
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let assistantMessageAdded = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ') || line.includes('[DONE]')) continue;
          
          try {
            const json = JSON.parse(line.slice(6));
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;

              // Update message in real-time
              setMessages(prev => {
                if (!assistantMessageAdded) {
                  assistantMessageAdded = true;
                  return [...prev, {
                    role: 'assistant',
                    content: assistantContent,
                    timestamp: new Date(),
                  }];
                }
                return prev.map((m, i) => 
                  i === prev.length - 1 
                    ? { ...m, content: assistantContent }
                    : m
                );
              });
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }

    } catch (err) {
      // ... error handling ...
    } finally {
      setIsLoading(false);
    }
  }, [messages, language, t]);

  // ... بقیه کد ...
};
```

---

## بخش چهارم: آماده‌سازی برای سرور مستقل

### ۴.۱ فایل `src/lib/supabase.ts` (موجود و آماده)

پروژه در حال حاضر دارای fallback credentials است که اجازه می‌دهد بدون تنظیم محیطی روی هر سرور کار کند:

```typescript
// این فایل از قبل موجود است و شامل fallback است
const FALLBACK_URL = 'https://etbekvhdroqiddcteqdq.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

### ۴.۲ ایجاد فایل `DEPLOYMENT.md`

```markdown
# راهنمای استقرار روی سرور مستقل

## ۱. پیش‌نیازها
- Node.js 18+ یا هر وب‌سرور (Apache/Nginx)
- اتصال اینترنت (برای Supabase backend)

## ۲. مراحل استقرار

### روش ۱: Static Hosting (ساده‌ترین)

\`\`\`bash
# Clone پروژه
git clone https://github.com/YOUR_REPO.git
cd YOUR_REPO

# نصب و build
npm install
npm run build

# فایل‌های dist/ را روی سرور آپلود کنید
\`\`\`

### روش ۲: Docker

\`\`\`dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
EXPOSE 80
\`\`\`

### روش ۳: PM2 + Vite Preview

\`\`\`bash
npm install pm2 -g
pm2 start "npm run preview -- --host 0.0.0.0 --port 80" --name museum
\`\`\`

## ۳. داده‌ها

همه داده‌ها در Supabase Cloud ذخیره شده‌اند:
- ✅ تمام تصاویر، متون، و تنظیمات
- ✅ اتوماتیک sync با هر نسخه
- ✅ نیازی به انتقال داده نیست

برای backup:
1. از پنل ادمین → پشتیبان‌گیری استفاده کنید
2. فایل JSON و تصاویر دانلود می‌شوند

## ۴. محدودیت‌ها

- نیاز به اتصال اینترنت برای داده‌های زنده
- در حالت آفلاین، آخرین داده‌های کش شده نمایش داده می‌شوند
```

---

## بخش پنجم: اسکریپت‌های Electron در package.json

### ۵.۱ تغییرات package.json

```json
{
  "name": "wrestling-museum-app",
  "version": "1.0.0",
  "main": "electron/main.js",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:8080 && electron . --dev\"",
    "build-electron": "npm run build && electron-builder --win",
    "build-portable": "npm run build && electron-builder --win portable",
    "build-installer": "npm run build && electron-builder --win nsis",
    "publish-update": "npm run build && electron-builder --win --publish always"
  },
  "devDependencies": {
    "electron": "^28.0.0",
    "electron-builder": "^24.9.0",
    "electron-updater": "^6.1.7",
    "electron-log": "^5.1.1",
    "concurrently": "^8.2.0",
    "wait-on": "^7.2.0"
  }
}
```

---

## خلاصه فایل‌های جدید و تغییرات

| فایل | نوع | توضیحات |
|------|-----|---------|
| `electron/main.js` | بروزرسانی | Splash Screen + Auto-Update |
| `electron/splash.html` | جدید | صفحه Splash زیبا با انیمیشن |
| `electron-builder.config.json` | بروزرسانی | تنظیمات publish برای Auto-Update |
| `supabase/functions/museum-assistant/index.ts` | بروزرسانی | Streaming + مدل سریع‌تر |
| `src/hooks/useChatAssistant.ts` | بروزرسانی | پشتیبانی از Streaming |
| `DEPLOYMENT.md` | جدید | راهنمای استقرار روی سرور |
| `package.json` | بروزرسانی | اسکریپت‌های Electron |

---

## بهبود سرعت دستیار

```text
قبل از بهینه‌سازی:
┌────────────────────────────────────┐
│  مدل: gemini-3-flash-preview      │
│  حالت: Non-streaming              │
│  زمان پاسخ: 3-5 ثانیه             │
└────────────────────────────────────┘

بعد از بهینه‌سازی:
┌────────────────────────────────────┐
│  مدل: gemini-2.5-flash-lite       │
│  حالت: Streaming                  │
│  زمان اولین token: <1 ثانیه       │
│  تجربه کاربری: فوری               │
└────────────────────────────────────┘

بهبود: ~3-5x سریع‌تر (اولین پاسخ)
```

---

## نکات مهم درباره انتقال به سرور دیگر

### داده‌ها خودکار منتقل می‌شوند:
1. **Backend (Supabase)**: همه داده‌ها در cloud هستند
2. **تصاویر**: از Supabase Storage سرو می‌شوند
3. **تنظیمات**: در دیتابیس ذخیره شده‌اند

### فقط کد frontend نیاز به deploy دارد:
```bash
git clone [repo-url]
npm install
npm run build
# فایل‌های dist/ را آپلود کنید
```

---

## دستورات تست محلی

```bash
# ۱. Clone از GitHub
git clone https://github.com/YOUR_REPO.git
cd YOUR_REPO

# ۲. نصب Dependencies
npm install
npm install --save-dev electron electron-builder electron-updater electron-log concurrently wait-on

# ۳. تست Electron در حالت توسعه
npm run electron:dev

# ۴. ساخت فایل EXE
npm run build-electron

# خروجی: release/ پوشه
```
