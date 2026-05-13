## پخش ویدیو بدون نیاز به Supabase (Bundle داخل اپ)

ویدیوها به صورت فایل static داخل `public/videos/` همراه با build منتشر می‌شوند.

- `scripts/bundle-videos.mjs`: همهٔ `intro_video_url` کشتی‌گیرها + `wrestler_media` نوع video را از Supabase دانلود و در `public/videos/<sha1>.mp4` ذخیره می‌کند و `manifest.json` می‌سازد.
- `src/lib/bundledVideos.ts`: در runtime مانیفست را لود و URL ریموت را به مسیر لوکال تبدیل می‌کند.
- `WrestlerProfilePage` و `MediaGallery` قبل از پخش از `resolveBundledVideo` استفاده می‌کنند.
- `npm run bundle:videos` یا `npm run build:bundled` قبل از deploy.
