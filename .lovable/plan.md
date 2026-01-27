

## برنامه جامع: نمایش حجم Storage، مقایسه فشرده‌سازی و رفع مشکل زوم تصاویر

---

### تشخیص مشکلات

#### 🔴 مشکل بحرانی: تصاویر زوم/برش شده

از تصویر ارسالی مشخص است که عکس کشتی‌گیر بریده شده و فقط بخشی از بدن نمایش داده می‌شود. علت:

```typescript
// src/components/ui/LazyImage.tsx - خط 91 و 105
className="... object-cover ..."  // ❌ باعث برش تصویر می‌شود
// باید باشد:
className="... object-contain ..."  // ✅ تصویر کامل نمایش داده می‌شود
```

`object-cover` تصویر را طوری بزرگ می‌کند که کل container را پر کند، و بخش‌های اضافی را برش می‌دهد. برای تصاویر پرتره این باعث می‌شود صورت بریده شود.

---

### راه‌حل‌های پیشنهادی

## بخش اول: رفع مشکل زوم/برش تصاویر

### ۱.۱ بروزرسانی `src/components/ui/LazyImage.tsx`

تغییر از `object-cover` به `object-contain` با پس‌زمینه مناسب:

```typescript
// تغییر کلاس‌های thumbnail
<img
  src={thumbnailSrc}
  className={cn(
    'absolute inset-0 w-full h-full object-contain bg-muted/30 ...'
    //                              ^^^^^^^^^^^^^^ تصویر کامل
  )}
/>

// تغییر کلاس‌های تصویر اصلی
<img
  src={imageSrc}
  className={cn(
    'w-full h-full object-contain bg-muted/20 ...'
    //             ^^^^^^^^^^^^^^ تصویر کامل
  )}
/>
```

### ۱.۲ افزودن prop برای انتخاب حالت نمایش

```typescript
interface LazyImageProps {
  // ...existing props
  /** نحوه نمایش: contain (کامل) یا cover (پر کردن) */
  objectFit?: 'contain' | 'cover';
}

// استفاده:
<LazyImage
  src={...}
  objectFit="contain"  // نمایش کامل تصویر
/>
```

---

## بخش دوم: نمایش حجم Storage در داشبورد ادمین

### ۲.۱ وضعیت فعلی Storage

بررسی دیتابیس نشان می‌دهد:

| Bucket | حجم فعلی |
|--------|----------|
| wrestler-media | 239.30 MB |
| album-media | 35.84 MB |
| building-media | 7.52 MB |
| **مجموع** | **~283 MB** |

### ۲.۲ ایجاد Hook برای دریافت آمار Storage

```typescript
// src/hooks/useStorageStats.ts

interface StorageStats {
  buckets: {
    name: string;
    sizeBytes: number;
    sizeMB: number;
    fileCount: number;
  }[];
  totalSizeBytes: number;
  totalSizeMB: number;
  totalFiles: number;
  isLoading: boolean;
  error: string | null;
}

export function useStorageStats(): StorageStats {
  // محاسبه حجم هر bucket با استفاده از list API
  // ...
}
```

### ۲.۳ بروزرسانی داشبورد ادمین

```typescript
// src/pages/admin/AdminDashboardPage.tsx

// افزودن کارت Storage
<GlassCard className="p-6">
  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
    <HardDrive className="h-5 w-5 text-primary" />
    فضای ذخیره‌سازی
  </h2>
  
  {/* نوار پیشرفت برای هر bucket */}
  <div className="space-y-3">
    {storageStats.buckets.map(bucket => (
      <div key={bucket.name}>
        <div className="flex justify-between text-sm mb-1">
          <span>{bucket.name}</span>
          <span>{bucket.sizeMB.toFixed(1)} MB</span>
        </div>
        <Progress value={(bucket.sizeMB / storageStats.totalSizeMB) * 100} />
      </div>
    ))}
  </div>
  
  <div className="mt-4 pt-4 border-t">
    <div className="text-2xl font-bold text-primary">
      {storageStats.totalSizeMB.toFixed(1)} MB
    </div>
    <div className="text-sm text-muted-foreground">
      مجموع فضای استفاده شده
    </div>
  </div>
</GlassCard>
```

---

## بخش سوم: مقایسه قبل/بعد فشرده‌سازی

### ۳.۱ افزودن ذخیره تاریخچه به CompressionSettings

```typescript
// ذخیره نتایج هر فشرده‌سازی در localStorage
interface CompressionHistory {
  timestamp: string;
  bucket: string;
  originalSize: number;
  compressedSize: number;
  savedBytes: number;
  filesProcessed: number;
}

const COMPRESSION_HISTORY_KEY = 'compression_history';

// نمایش کارت مقایسه:
<GlassCard className="p-4 bg-green-500/10 border-green-500/30">
  <h4 className="font-medium text-green-500 flex items-center gap-2">
    <CheckCircle className="h-4 w-4" />
    صرفه‌جویی کل
  </h4>
  <div className="mt-2 grid grid-cols-3 gap-4 text-center">
    <div>
      <div className="text-lg font-bold text-muted-foreground">
        {formatBytes(totalOriginal)}
      </div>
      <div className="text-xs text-muted-foreground">قبل</div>
    </div>
    <div>
      <div className="text-2xl">→</div>
    </div>
    <div>
      <div className="text-lg font-bold text-green-500">
        {formatBytes(totalCompressed)}
      </div>
      <div className="text-xs text-muted-foreground">بعد</div>
    </div>
  </div>
  <div className="mt-2 text-center text-green-500 font-bold">
    {Math.round((1 - totalCompressed / totalOriginal) * 100)}% کاهش حجم
  </div>
</GlassCard>
```

---

## بخش چهارم: بهبود فشرده‌سازی دسته‌ای

### ۴.۱ افزودن دکمه "فشرده‌سازی همه"

```typescript
// یک دکمه برای اجرای فشرده‌سازی روی تمام buckets
<Button
  onClick={handleCompressAll}
  disabled={batchProgress.isRunning}
  className="w-full gold-button"
>
  <Zap className="h-4 w-4 ml-2" />
  فشرده‌سازی تمام تصاویر
</Button>
```

### ۴.۲ نمایش آمار پیشرفت بهتر

```typescript
// افزودن ETA و سرعت
<div className="text-sm text-muted-foreground">
  ⏱️ زمان تخمینی: {formatTime(estimatedTime)}
  📊 سرعت: {(processedPerSecond).toFixed(1)} فایل/ثانیه
</div>
```

---

## خلاصه تغییرات

| فایل | تغییر | اولویت |
|------|-------|--------|
| `src/components/ui/LazyImage.tsx` | تغییر `object-cover` به `object-contain` | 🔴 بحرانی |
| `src/hooks/useStorageStats.ts` | ایجاد hook برای آمار storage | 🟠 مهم |
| `src/pages/admin/AdminDashboardPage.tsx` | افزودن کارت فضای ذخیره‌سازی | 🟠 مهم |
| `src/components/admin/CompressionSettings.tsx` | افزودن تاریخچه و مقایسه قبل/بعد | 🟡 بهبود |

---

## نتایج مورد انتظار

```text
مشکل زوم تصویر:
┌────────────────────────────────────────┐
│  قبل: فقط سینه و مدال نمایش داده شد   │
│  بعد: تصویر کامل از سر تا کمر          │
└────────────────────────────────────────┘

داشبورد ادمین:
┌────────────────────────────────────────┐
│  📊 فضای ذخیره‌سازی                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  wrestler-media  ████████████░░ 239 MB │
│  album-media     ██░░░░░░░░░░░░  36 MB │
│  building-media  █░░░░░░░░░░░░░   8 MB │
│  ────────────────────────────────────  │
│  مجموع: 283 MB                         │
│                                         │
│  📉 صرفه‌جویی از فشرده‌سازی:            │
│  500 MB → 283 MB (43% کاهش)            │
└────────────────────────────────────────┘
```

