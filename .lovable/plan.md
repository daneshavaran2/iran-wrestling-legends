
## برنامه رفع مشکلات: زوم تصاویر، خطای اتصال سرور و ترجمه‌های گمشده

---

### تشخیص مشکلات از تصاویر ارسالی

#### 🔴 مشکل ۱: تصاویر بیش از حد زوم شده (IMG_7070, IMG_7069)

از تصاویر مشخص است که فقط صورت کشتی‌گیر دیده می‌شود و بدن بریده شده است. با اینکه `objectFit="cover"` و `objectPosition="top"` تنظیم شده، مشکل این است که:

```text
┌─────────────────────────────────────────────────────────────┐
│  تصویر اصلی کشتی‌گیر: نسبت ابعاد 3:5 (پرتره بلند)           │
│  Container کارت: نسبت ابعاد 3:4 (کوتاه‌تر)                  │
│                                                             │
│  نتیجه با object-cover + top:                               │
│  تصویر از بالا شروع می‌شود ولی چون container کوتاه‌تر است، │
│  تصویر زوم می‌شود تا عرض را پر کند → صورت بزرگ می‌شود!      │
└─────────────────────────────────────────────────────────────┘
```

**راه‌حل**: تغییر `objectPosition` به `center 20%` یا تنظیم نسبت ابعاد container و افزودن قابلیت تنظیم فقط عرض:

```typescript
// WrestlerCard.tsx
<LazyImage
  objectFit="cover"
  objectPosition="center 20%"  // 20% از بالا - نه top که سر بریده شود
/>
```

#### 🔴 مشکل ۲: خطای اتصال روی سرور Liara (IMG_7072)

پیام خطا: "خطا در بارگذاری اطلاعات. لطفاً اتصال اینترنت را بررسی کنید"

این خطا زمانی ظاهر می‌شود که:
1. Supabase API پاسخ نمی‌دهد یا timeout می‌شود
2. CORS مشکل دارد
3. شبکه کند است و درخواست‌ها timeout می‌شوند

**بررسی کد فعلی:**
```typescript
// WrestlerContext.tsx - خط 234
setError('خطا در بارگذاری اطلاعات. لطفاً اتصال اینترنت را بررسی کنید.');
```

این پیام خطا خیلی کلی است. باید:
1. Timeout طولانی‌تر تنظیم شود
2. Retry mechanism اضافه شود
3. پیام خطای دقیق‌تر نمایش داده شود

#### 🔴 مشکل ۳: ترجمه گمشده (IMG_7071)

پیام "history.noContentDesc" به جای متن ترجمه شده نمایش داده می‌شود:

```typescript
// HistoryListPage.tsx - خط 60
<p className="text-muted-foreground">
  {t('history.noContentDesc')}  // ❌ این کلید در locales وجود ندارد!
</p>
```

**فایل fa.json فعلی:**
```json
"history": {
  "title": "تاریخچه کشتی ایران",
  "subtitle": "سفری در گذر زمان",
  "noContent": "محتوای تاریخچه موجود نیست"
  // ❌ noContentDesc وجود ندارد!
}
```

---

### راه‌حل‌های پیشنهادی

## بخش اول: رفع زوم بیش از حد تصاویر

### ۱.۱ تغییر `objectPosition` در WrestlerCard

```typescript
// src/components/WrestlerCard.tsx
<LazyImage
  src={getThumbnailUrl(wrestler.image_url)}
  thumbnailSrc={getTinyThumbnailUrl(wrestler.image_url)}
  alt={wrestler.name}
  className="w-full h-full transition-transform duration-500 group-hover:scale-110"
  objectFit="cover"
  objectPosition="center 15%"  // ← تغییر از "top" به "center 15%"
/>
```

این تغییر باعث می‌شود:
- تصویر از 15% بالای مرکز شروع شود
- صورت کشتی‌گیر در مرکز بماند
- بخش‌های کمتری از سر و پا بریده شود

### ۱.۲ تغییر نسبت ابعاد container (اختیاری)

اگر تصاویر همچنان زوم بودند، نسبت ابعاد را کمی بلندتر کنیم:

```typescript
// از aspect-[3/4] به aspect-[3/4.5] یا aspect-[2/3]
<div className="relative overflow-hidden rounded-2xl mb-4 2xl:mb-6 aspect-[2/3]">
```

---

## بخش دوم: رفع خطای اتصال روی سرور خارجی

### ۲.۱ بهبود Error Handling در WrestlerContext

```typescript
// src/contexts/WrestlerContext.tsx

const fetchWrestlers = async (): Promise<boolean> => {
  try {
    // افزودن timeout برای جلوگیری از انتظار بی‌نهایت
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15 ثانیه

    const { data, error } = await supabase
      .from('wrestlers')
      .select('*')
      .order('name')
      .abortSignal(controller.signal);

    clearTimeout(timeout);

    if (error) throw error;
    
    // ... rest of code
    return true;
  } catch (err: any) {
    console.error('Error fetching wrestlers:', err);
    
    // بررسی نوع خطا و ارائه پیام مناسب
    if (err.name === 'AbortError') {
      console.log('Request timed out, using cached data');
    }
    
    return false;
  }
};
```

### ۲.۲ افزودن Retry Logic خودکار

```typescript
const refreshWrestlers = async (retryCount = 0) => {
  setIsLoading(true);
  setError(null);
  
  const results = await Promise.all([
    fetchWrestlers(),
    fetchAchievements(),
    fetchMedia()
  ]);
  
  const allSucceeded = results.every(r => r === true);
  
  if (!allSucceeded) {
    // تلاش مجدد خودکار (حداکثر 2 بار)
    if (retryCount < 2 && !isOffline) {
      console.log(`Retrying... (attempt ${retryCount + 2})`);
      setTimeout(() => refreshWrestlers(retryCount + 1), 2000);
      return;
    }
    
    const hasCachedData = wrestlers.length > 0;
    
    if (hasCachedData) {
      setIsOffline(true);
      setError('نمایش داده‌های ذخیره شده (آفلاین)');
    } else {
      setError('خطا در اتصال به سرور. لطفاً دوباره تلاش کنید.');
    }
  } else {
    setIsOffline(false);
  }
  
  setIsLoading(false);
};
```

### ۲.۳ بهبود Connection Test در lib/supabase.ts

```typescript
// src/lib/supabase.ts - افزودن تست اتصال با timeout
export const testConnection = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const { error } = await supabase
      .from('wrestlers')
      .select('id')
      .limit(1)
      .abortSignal(controller.signal);
    
    clearTimeout(timeout);
    return !error;
  } catch {
    return false;
  }
};
```

---

## بخش سوم: افزودن ترجمه‌های گمشده

### ۳.۱ بروزرسانی fa.json

```json
{
  "history": {
    "title": "تاریخچه کشتی ایران",
    "subtitle": "سفری در گذر زمان",
    "noContent": "محتوای تاریخچه موجود نیست",
    "noContentDesc": "محتوایی برای نمایش وجود ندارد. به زودی اطلاعات بیشتری اضافه خواهد شد."
  }
}
```

### ۳.۲ بروزرسانی en.json

```json
{
  "history": {
    "title": "History of Iranian Wrestling",
    "subtitle": "A Journey Through Time",
    "noContent": "No history content available",
    "noContentDesc": "No content to display. More information will be added soon."
  }
}
```

### ۳.۳ بروزرسانی ar.json

```json
{
  "history": {
    "title": "تاريخ المصارعة الإيرانية",
    "subtitle": "رحلة عبر الزمن",
    "noContent": "لا يوجد محتوى تاريخي",
    "noContentDesc": "لا يوجد محتوى للعرض. سيتم إضافة المزيد من المعلومات قريباً."
  }
}
```

---

## بخش چهارم: بهینه‌سازی Preload تصاویر

### ۴.۱ افزودن Preload در لیست کشتی‌گیران

```typescript
// src/pages/WrestlersListPage.tsx

useEffect(() => {
  // Preload تصاویر 6 کشتی‌گیر اول برای لود سریع‌تر
  if (filteredWrestlers.length > 0) {
    const firstSixImages = filteredWrestlers
      .slice(0, 6)
      .map(w => getThumbnailUrl(w.image_url))
      .filter(Boolean);
    
    preloadImages(firstSixImages);
  }
}, [filteredWrestlers]);
```

### ۴.۲ افزودن Link Preload در Head

```typescript
// در LazyImage - برای تصاویر اولیه
useEffect(() => {
  if (src && isInView) {
    // Hint به مرورگر برای دانلود سریع‌تر
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
    
    return () => {
      document.head.removeChild(link);
    };
  }
}, [src, isInView]);
```

---

## خلاصه تغییرات

| فایل | تغییر | اولویت |
|------|-------|--------|
| `src/components/WrestlerCard.tsx` | تغییر objectPosition از "top" به "center 15%" | بحرانی |
| `src/contexts/WrestlerContext.tsx` | افزودن timeout و retry logic | بحرانی |
| `src/locales/fa.json` | افزودن history.noContentDesc | بحرانی |
| `src/locales/en.json` | افزودن history.noContentDesc | بحرانی |
| `src/locales/ar.json` | افزودن history.noContentDesc | بحرانی |
| `src/pages/WrestlersListPage.tsx` | افزودن preload برای تصاویر اول | بهبود |
| `src/lib/supabase.ts` | بهبود testConnection با timeout | بهبود |

---

## نتایج مورد انتظار

```text
مشکل زوم تصویر:
┌────────────────────────────────────────────┐
│  قبل: فقط صورت بزرگ‌نمایی شده دیده می‌شد  │
│  بعد: سر + سینه + شانه‌ها در تصویر          │
│       نسبت طبیعی‌تر و حرفه‌ای‌تر            │
└────────────────────────────────────────────┘

مشکل خطای سرور:
┌────────────────────────────────────────────┐
│  قبل: خطای کلی "اتصال اینترنت را بررسی"    │
│  بعد: تلاش مجدد خودکار (۲ بار)             │
│       نمایش داده‌های کش در صورت خطا         │
│       پیام خطای دقیق‌تر                     │
└────────────────────────────────────────────┘

مشکل ترجمه:
┌────────────────────────────────────────────┐
│  قبل: "history.noContentDesc" نمایش داده   │
│  بعد: "محتوایی برای نمایش وجود ندارد..."    │
└────────────────────────────────────────────┘
```
