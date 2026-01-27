

## تغییر مسیر خروجی Build به 'build'

یک تغییر ساده در فایل `vite.config.ts` برای تغییر مسیر خروجی از `dist` به `build` (مشابه Create React App).

---

### تغییر مورد نیاز

**فایل:** `vite.config.ts`

**تغییر:** افزودن `outDir: 'build'` به بخش `build`

```typescript
build: {
  outDir: 'build',  // ← افزودن این خط
  target: 'esnext',
  minify: 'esbuild',
  // ... سایر تنظیمات
}
```

---

### وضعیت فعلی

```typescript
build: {
  target: 'esnext',
  minify: 'esbuild',
  cssMinify: true,
  rollupOptions: { ... },
  chunkSizeWarningLimit: 1000,
}
```

---

### وضعیت بعد از تغییر

```typescript
build: {
  outDir: 'build',  // خروجی به پوشه build
  target: 'esnext',
  minify: 'esbuild',
  cssMinify: true,
  rollupOptions: { ... },
  chunkSizeWarningLimit: 1000,
}
```

---

### نتیجه

```text
قبل:
npm run build → dist/

بعد:
npm run build → build/
```

این تغییر با سرویس‌های Deploy مثل Liara که انتظار پوشه `build` را دارند سازگار است.

