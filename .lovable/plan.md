## هدف
سیستم bundle ویدیوها کاملاً خودکار شود. تنها با `npm run build` همه ویدیوهای جدید Supabase دانلود، manifest ساخته، فایل‌های یتیم پاک، و در runtime به صورت local-first مصرف شوند. خطای Supabase نباید build را break کند.

## تغییرات

### 1) `scripts/bundle-videos.mjs` (بازنویسی)
سینک کامل و idempotent با لاگ رنگی:
- لود `.env` و ساخت Supabase client (anon).
- Fetch همه ویدیوها:
  - `wrestlers.intro_video_url`
  - `wrestler_media` با `type='video'`
- محاسبه نام فایل = `<sha1(url).slice(0,16)>.<ext>` (deterministic؛ تغییر URL = فایل جدید).
- HEAD request برای گرفتن `content-length` + `etag`/`last-modified`. اگر فایل local وجود دارد و سایز برابر است → **skip** (لاگ `=`).
- در غیر این صورت → دانلود به `.tmp` و rename اتمیک. لاگ `+` برای جدید، `↻` برای آپدیت‌شده.
- ساخت Set از فایل‌های مورد نیاز. هر چیز اضافه در `public/videos/` (به جز `manifest.json` و `.gitkeep`) → **delete** و لاگ `−`.
- نوشتن `public/videos/manifest.json` به صورت اتمیک (`{ generatedAt, videos: { [remoteUrl]: "/videos/<file>" } }`). فرمت تخت قبلی نیز در runtime پشتیبانی می‌شود.
- **Resilience**: اگر Supabase fail کرد (network/timeout/auth) → warning بزن، manifest قبلی را دست‌نخورده نگه‌دار، **exit 0** تا build ادامه پیدا کند. اگر دانلود یک فایل خاص fail شد، نسخه cache قبلی (در صورت وجود) حفظ می‌شود.
- خلاصه پایانی: `downloaded / updated / skipped / removed / failed / totalSize`.

### 2) `package.json`
خودکارسازی build:
```json
"prebuild": "node scripts/bundle-videos.mjs || true",
"build": "vite build && rm -rf build && cp -R dist build"
```
- `prebuild` به صورت native توسط npm قبل از `build` اجرا می‌شود → نیازی به `build:bundled` نیست (اما alias می‌ماند).
- `|| true` ضامن دوم در برابر crash است (در کنار exit 0 خود اسکریپت).
- اضافه: `"sync:videos": "node scripts/bundle-videos.mjs"` برای اجرای دستی.

### 3) `src/lib/bundledVideos.ts`
- پشتیبانی از هر دو فرمت manifest: تخت `{url: path}` یا جدید `{videos: {url: path}}`.
- `resolveBundledVideo(url)`:
  1. اگر در manifest و فایل local موجود (HEAD probe کش‌شده per-session) → برگردان local.
  2. در غیر این‌صورت → fallback به URL ریموت.
- probe با `fetch(localPath, { method: 'HEAD' })` فقط بار اول per URL، نتیجه در Map نگه داشته می‌شود.

### 4) `public/videos/.gitkeep` + `public/videos/manifest.json`
- نگه‌داشتن پوشه. manifest خالی به عنوان baseline.
- `.gitignore`: نادیده گرفتن `public/videos/*.mp4|webm|mov` تا فایل‌های سنگین در git نروند، فقط `manifest.json` و `.gitkeep` track شوند.

### 5) سازگاری Vite/Next
- اسکریپت کاملاً Node ESM خام، بدون وابستگی به Vite. `prebuild` در هر دو پلتفرم استاندارد است.

## ساختار نهایی
```text
public/
  videos/
    .gitkeep
    manifest.json          # auto, tracked
    <hash>.mp4             # auto, gitignored
scripts/
  bundle-videos.mjs        # sync orchestrator
src/lib/
  bundledVideos.ts         # local-first resolver + remote fallback
```

## رفتار اجرا
- `npm run build` → prebuild → sync (موفق یا silent-fail) → vite build → آماده.
- بدون internet/Supabase: build همچنان موفق، manifest قبلی استفاده می‌شود.
- ویدیوی جدید در DB: اولین build بعدی خودکار دانلود.
- ویدیوی حذف‌شده در DB: فایل local خودکار پاک.
