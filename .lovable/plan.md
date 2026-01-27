

## برنامه جامع: رفع مشکل بارگذاری تصاویر و افزودن فشرده‌سازی خودکار به پنل ادمین

---

### تشخیص مشکلات

بررسی‌ها نشان می‌دهد که سه مشکل اصلی وجود دارد:

#### 🔴 باگ بحرانی #1: در `useMediaUpload.ts` فایل اصلی آپلود می‌شود!

```typescript
// خط 40 - باگ بحرانی:
.upload(fileName, file, {   // ❌ file اصلی آپلود می‌شود!
// باید باشد:
.upload(fileName, processedFile, {   // ✅ فایل فشرده شده
```

این باعث می‌شود که با وجود اجرای فشرده‌سازی، همچنان فایل اصلی (بدون فشرده‌سازی) آپلود شود.

#### 🔴 باگ #2: تصاویر از Image Transform استفاده نمی‌کنند

`WrestlerCard` تصویر را مستقیم از `image_url` می‌گیرد، بدون استفاده از `getOptimizedImageUrl`:

```typescript
// WrestlerCard.tsx
<LazyImage
  src={wrestler.image_url || undefined}  // ❌ URL اصلی
  // باید باشد:
  src={getOptimizedImageUrl(wrestler.image_url, { width: 400, quality: 70 })}
/>
```

#### 🔴 باگ #3: فشرده‌سازی فقط برای BMP فعال است

تابع `convertToWebP` فقط فایل‌های BMP را تبدیل می‌کند، اما برای JPEG/PNG حجیم هیچ کاری نمی‌کند.

---

### راه‌حل‌های پیشنهادی

## بخش اول: رفع باگ بحرانی آپلود

### ۱.۱ اصلاح `src/hooks/useMediaUpload.ts`

```typescript
// خط 38-43 - اصلاح
const { data, error: uploadError } = await supabase.storage
  .from(bucket)
  .upload(fileName, processedFile, {  // ✅ تغییر از file به processedFile
    cacheControl: '3600',
    upsert: false,
  });
```

---

## بخش دوم: بهبود فشرده‌سازی خودکار

### ۲.۱ بروزرسانی `src/utils/imageCompressor.ts`

افزودن فشرده‌سازی تمام تصاویر (نه فقط BMP):

```typescript
/**
 * فشرده‌سازی و تبدیل همه تصاویر به WebP
 * کاهش حجم تا ۸۰٪
 */
export async function optimizeImage(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    outputFormat?: 'webp' | 'jpeg';
  } = {}
): Promise<File> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.82,
    outputFormat = 'webp'
  } = options;

  // فقط تصاویر را پردازش کن
  if (!file.type.startsWith('image/')) {
    return file;
  }

  // برای فایل‌های کوچک (زیر 200KB) نیازی نیست
  if (file.size < 200 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      
      let { width, height } = img;
      
      // محاسبه ابعاد جدید
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }
      
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      
      const mimeType = outputFormat === 'webp' ? 'image/webp' : 'image/jpeg';
      
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file);
            return;
          }
          
          const newExt = outputFormat === 'webp' ? '.webp' : '.jpg';
          const newName = file.name.replace(/\.[^.]+$/, newExt);
          
          const optimizedFile = new File([blob], newName, {
            type: mimeType,
            lastModified: Date.now(),
          });
          
          console.log(`✅ فشرده‌سازی: ${file.name} (${(file.size / 1024).toFixed(0)}KB) → ${newName} (${(blob.size / 1024).toFixed(0)}KB)`);
          
          resolve(optimizedFile);
        },
        mimeType,
        quality
      );
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      resolve(file);
    };
    
    img.src = URL.createObjectURL(file);
  });
}
```

---

## بخش سوم: استفاده از Image Transform در کارت‌ها

### ۳.۱ بروزرسانی `src/components/WrestlerCard.tsx`

```typescript
import { getThumbnailUrl, getTinyThumbnailUrl } from '@/utils/imageOptimizer';

// در بخش رندر:
<LazyImage
  src={getThumbnailUrl(wrestler.image_url)}  // 400px, quality 60
  thumbnailSrc={getTinyThumbnailUrl(wrestler.image_url)}  // 150px برای بارگذاری سریع
  alt={wrestler.name}
  className="w-full h-full transition-transform duration-500 group-hover:scale-110"
/>
```

### ۳.۲ بروزرسانی `src/components/ui/LazyImage.tsx`

افزودن Progressive Loading با retry:

```typescript
// افزودن retry mechanism
const [retryCount, setRetryCount] = useState(0);
const MAX_RETRIES = 3;

const handleError = () => {
  if (retryCount < MAX_RETRIES) {
    setRetryCount(prev => prev + 1);
    setIsLoaded(false);
    // اضافه کردن cache-busting
    setTimeout(() => {
      const newSrc = `${imageSrc}${imageSrc.includes('?') ? '&' : '?'}retry=${retryCount + 1}`;
      // reload با URL جدید
    }, 500 * (retryCount + 1));
  } else {
    setHasError(true);
    setIsLoaded(true);
  }
};
```

---

## بخش چهارم: نمایش وضعیت فشرده‌سازی در پنل ادمین

### ۴.۱ بروزرسانی `src/hooks/useMediaUpload.ts`

```typescript
interface UploadProgress {
  fileName: string;
  progress: number;
  status?: 'processing' | 'compressing' | 'uploading' | 'complete';
  originalSize?: number;
  compressedSize?: number;
}

const uploadFile = async (file: File, folderId: string, bucket: string = 'wrestler-media'): Promise<string> => {
  setIsUploading(true);
  setError(null);

  try {
    const originalSize = file.size;
    
    setUploadProgress(prev => [...prev, { 
      fileName: file.name, 
      progress: 0, 
      status: 'compressing',
      originalSize 
    }]);

    // فشرده‌سازی تصویر
    const processedFile = await optimizeImage(file, {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.82,
      outputFormat: 'webp'
    });
    
    const compressedSize = processedFile.size;
    const compressionRatio = Math.round((1 - compressedSize / originalSize) * 100);

    // بروزرسانی پیشرفت
    setUploadProgress(prev => 
      prev.map(p => p.fileName === file.name ? { 
        ...p, 
        progress: 30, 
        status: 'uploading',
        compressedSize 
      } : p)
    );

    const fileExt = processedFile.name.split('.').pop();
    const fileName = `${folderId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { data, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, processedFile, {  // ✅ فایل فشرده شده
        cacheControl: '31536000', // 1 year cache
        upsert: false,
      });

    if (uploadError) throw uploadError;

    setUploadProgress(prev => 
      prev.map(p => p.fileName === file.name ? { 
        ...p, 
        progress: 100, 
        status: 'complete' 
      } : p)
    );

    // نمایش نتیجه
    console.log(`✅ آپلود موفق: ${file.name} | کاهش ${compressionRatio}% (${(originalSize / 1024).toFixed(0)}KB → ${(compressedSize / 1024).toFixed(0)}KB)`);

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (err: any) {
    // ...
  }
};
```

### ۴.۲ بروزرسانی `src/components/UploadDropzone.tsx`

نمایش اطلاعات فشرده‌سازی:

```typescript
// در بخش Upload Progress
{uploadProgress.map((item, index) => (
  <div key={index} className="glass-card p-3">
    <div className="flex items-center justify-between text-sm mb-2">
      <span className="truncate">{item.fileName}</span>
      <div className="flex items-center gap-2">
        {item.status === 'compressing' && (
          <span className="text-yellow-500 text-xs">فشرده‌سازی...</span>
        )}
        {item.compressedSize && item.originalSize && (
          <span className="text-green-500 text-xs">
            {Math.round((1 - item.compressedSize / item.originalSize) * 100)}% کاهش
          </span>
        )}
        <span className="text-primary">{item.progress}%</span>
      </div>
    </div>
    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
      <div 
        className={cn(
          "h-full rounded-full transition-all duration-300",
          item.status === 'compressing' ? 'bg-yellow-500' : 'bg-primary'
        )}
        style={{ width: `${item.progress}%` }}
      />
    </div>
  </div>
))}
```

---

## بخش پنجم: تنظیمات فشرده‌سازی در پنل ادمین

### ۵.۱ افزودن کامپوننت تنظیمات فشرده‌سازی

```typescript
// src/components/admin/CompressionSettings.tsx

interface CompressionSettingsProps {
  onSettingsChange: (settings: CompressionOptions) => void;
}

export function CompressionSettings({ onSettingsChange }: CompressionSettingsProps) {
  const [quality, setQuality] = useState(82);
  const [maxWidth, setMaxWidth] = useState(1920);
  const [format, setFormat] = useState<'webp' | 'jpeg'>('webp');

  return (
    <div className="glass-card p-4 space-y-4">
      <h4 className="font-medium flex items-center gap-2">
        <Settings className="h-4 w-4" />
        تنظیمات فشرده‌سازی خودکار
      </h4>
      
      <div className="space-y-3">
        <div>
          <label className="text-sm text-muted-foreground">کیفیت: {quality}%</label>
          <Slider 
            value={[quality]} 
            onValueChange={([v]) => setQuality(v)}
            min={50} 
            max={95} 
            step={5}
          />
        </div>
        
        <div>
          <label className="text-sm text-muted-foreground">حداکثر عرض: {maxWidth}px</label>
          <Slider 
            value={[maxWidth]} 
            onValueChange={([v]) => setMaxWidth(v)}
            min={800} 
            max={2560} 
            step={160}
          />
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setFormat('webp')}
            className={cn('px-3 py-1 rounded', format === 'webp' ? 'gold-button' : 'liquid-button')}
          >
            WebP (کوچکتر)
          </button>
          <button 
            onClick={() => setFormat('jpeg')}
            className={cn('px-3 py-1 rounded', format === 'jpeg' ? 'gold-button' : 'liquid-button')}
          >
            JPEG (سازگار)
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## خلاصه تغییرات

| فایل | تغییر | اولویت |
|------|-------|--------|
| `src/hooks/useMediaUpload.ts` | رفع باگ: آپلود `processedFile` به جای `file` | 🔴 بحرانی |
| `src/utils/imageCompressor.ts` | افزودن تابع `optimizeImage` برای همه فرمت‌ها | 🔴 مهم |
| `src/components/WrestlerCard.tsx` | استفاده از `getThumbnailUrl` | 🟠 مهم |
| `src/components/ui/LazyImage.tsx` | Progressive loading + retry | 🟡 بهبود |
| `src/components/UploadDropzone.tsx` | نمایش اطلاعات فشرده‌سازی | 🟡 بهبود |
| `src/components/admin/CompressionSettings.tsx` | تنظیمات قابل تغییر | 🟢 اختیاری |

---

## نتایج مورد انتظار

```text
قبل از اصلاح:
┌────────────────────────────────────────┐
│  تصویر 5MB JPEG → آپلود 5MB           │
│  زمان بارگذاری: 5-10 ثانیه (LTE)      │
│  صفحه خالی در موبایل                   │
└────────────────────────────────────────┘

بعد از اصلاح:
┌────────────────────────────────────────┐
│  تصویر 5MB JPEG → آپلود 400KB WebP    │
│  نمایش: 150px thumbnail (20KB)         │
│  زمان بارگذاری: <1 ثانیه               │
│  Progressive: blur → sharp             │
└────────────────────────────────────────┘

کاهش حجم: ~90%
افزایش سرعت: ~10x
```

