
## برنامه رفع سه مشکل: تعداد صفر، تصویر باریک و کلیپ پخش نشدنی

---

### تشخیص مشکلات

#### مشکل ۱: تعداد کشتی‌گیران صفر

```text
┌──────────────────────────────────────────────────────────┐
│ دیتابیس: 39 کشتی‌گیر | 11 نفر visible                     │
│ صفحه نشان می‌دهد: 0 یا 11                                │
│                                                          │
│ علت: getVisibleWrestlers() قبل از اتمام fetch            │
│       خوانده می‌شود و آرایه خالی برمی‌گرداند              │
└──────────────────────────────────────────────────────────┘
```

**مشکل در کد:**
```typescript
// WrestlersListPage.tsx
const { getVisibleWrestlers, isLoading, error } = useWrestlers();
const visibleWrestlers = getVisibleWrestlers(); // ❌ خارج از useMemo

// وقتی isLoading=true است، wrestlers هنوز خالی است
// اما visibleWrestlers قبل از لود محاسبه شده
```

#### مشکل ۲: تصویر باریک

از تصویر ارسالی مشخص است که تصویر کشتی‌گیر به صورت عمودی باریک شده. علت:

```typescript
// WrestlerCard.tsx
<div className="... aspect-[3/4]">  // Container 3:4 (پرتره)
  <LazyImage
    objectFit="contain"  // ← مشکل! تصویر را کوچک می‌کند تا کل دیده شود
  />
</div>
```

`object-contain` باعث می‌شود اگر تصویر نسبت متفاوتی داشته باشد، با فضای خالی اطراف نمایش داده شود. برای تصاویر پرتره کشتی‌گیران، `object-cover` بهتر است اما با `object-position: top` تا صورت بریده نشود.

#### مشکل ۳: کلیپ پخش نمی‌شود

```typescript
// WrestlerProfilePage.tsx - IntroVideo
<video
  autoPlay        // ✓ صحیح
  muted           // ✓ صحیح
  loop            // ✓ صحیح
  playsInline     // ✓ صحیح
  src={src}       // ❌ فرمت .mov در iOS مشکل‌ساز
/>
```

مشکلات احتمالی:
1. فرمت `.mov` در مرورگرهای غیر-Apple پشتیبانی نمی‌شود
2. autoPlay در iOS نیاز به تعامل اولیه کاربر دارد
3. عدم مدیریت خطای لود ویدیو

---

### راه‌حل‌ها

## بخش اول: رفع تعداد صفر کشتی‌گیران

### ۱.۱ بروزرسانی `src/pages/WrestlersListPage.tsx`

تبدیل `visibleWrestlers` به `useMemo` با وابستگی صحیح:

```typescript
// قبل:
const visibleWrestlers = getVisibleWrestlers();

// بعد:
const { wrestlers, getVisibleWrestlers, isLoading, error } = useWrestlers();

const visibleWrestlers = useMemo(() => {
  return getVisibleWrestlers();
}, [wrestlers]); // ← وابستگی به wrestlers برای re-render بعد از fetch
```

### ۱.۲ اضافه کردن loading state بهتر

نمایش skeleton تا زمانی که داده‌ها آماده نیستند:

```typescript
// نمایش تعداد فقط بعد از لود
{!isLoading && (
  <p className="text-muted-foreground">
    {t('wrestler.count').replace('{count}', String(filteredWrestlers.length))}
  </p>
)}
```

---

## بخش دوم: رفع تصویر باریک

### ۲.۱ بروزرسانی `src/components/WrestlerCard.tsx`

تغییر به `object-cover` با `object-position: center top`:

```typescript
<LazyImage
  src={getThumbnailUrl(wrestler.image_url)}
  thumbnailSrc={getTinyThumbnailUrl(wrestler.image_url)}
  alt={wrestler.name}
  className="w-full h-full transition-transform duration-500 group-hover:scale-110"
  objectFit="cover"         // ← تغییر از contain به cover
  objectPosition="top"      // ← صورت بالا بماند
/>
```

### ۲.۲ بروزرسانی `src/components/ui/LazyImage.tsx`

افزودن prop برای `objectPosition`:

```typescript
interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  // ...existing props
  objectFit?: 'contain' | 'cover';
  objectPosition?: string;  // ← جدید: مثل 'top', 'center', 'top center'
}

// در className:
className={cn(
  'w-full h-full ...',
  objectFit === 'contain' ? 'object-contain' : 'object-cover',
)}
style={{ objectPosition: objectPosition || 'center' }}
```

---

## بخش سوم: رفع پخش نشدن کلیپ

### ۳.۱ بروزرسانی `IntroVideo` در `src/pages/WrestlerProfilePage.tsx`

افزودن مدیریت خطا و fallback:

```typescript
function IntroVideo({ src, wrestlerName }: { src: string; wrestlerName: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);  // ← شروع با false
  const [isMuted, setIsMuted] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // تلاش برای autoPlay بعد از لود
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      setIsReady(true);
      video.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false)); // Autoplay blocked
    };

    video.addEventListener('canplay', handleCanPlay);
    return () => video.removeEventListener('canplay', handleCanPlay);
  }, []);

  const handleError = () => {
    setHasError(true);
    console.error('Error loading video:', src);
  };

  if (hasError) {
    return (
      <EmptyState
        icon={<AlertCircle className="h-16 w-16 text-destructive" />}
        title="خطا در بارگذاری ویدیو"
        description="فرمت ویدیو پشتیبانی نمی‌شود یا فایل در دسترس نیست"
      />
    );
  }

  return (
    <div className="relative rounded-3xl overflow-hidden group cyber-glass cyber-hud">
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      
      <div className="aspect-video w-full">
        <video
          ref={videoRef}
          src={src}
          muted={isMuted}
          loop
          playsInline
          preload="auto"
          onError={handleError}
          className={cn(
            "w-full h-full object-contain bg-black/50",
            !isReady && "opacity-0"
          )}
          onClick={togglePlay}
        />
      </div>
      
      {/* دکمه پخش بزرگ در وسط برای موبایل */}
      {isReady && !isPlaying && (
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={togglePlay}
        >
          <div className="p-6 rounded-full bg-primary/80 hover:bg-primary transition-colors">
            <Play className="h-12 w-12 text-white" />
          </div>
        </div>
      )}
      
      {/* Controls Overlay - existing code */}
    </div>
  );
}
```

### ۳.۲ پشتیبانی از فرمت‌های مختلف

افزودن تشخیص فرمت و هشدار در پنل ادمین:

```typescript
// در صفحه ویرایش کشتی‌گیر
const SUPPORTED_VIDEO_FORMATS = ['.mp4', '.webm'];
const isVideoSupported = (url: string) => {
  return SUPPORTED_VIDEO_FORMATS.some(ext => url.toLowerCase().endsWith(ext));
};

// هشدار در UI
{wrestler.intro_video_url && !isVideoSupported(wrestler.intro_video_url) && (
  <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-sm">
    ⚠️ فرمت ویدیو (.mov) ممکن است در برخی مرورگرها پشتیبانی نشود. 
    پیشنهاد: از فرمت MP4 یا WebM استفاده کنید.
  </div>
)}
```

---

## خلاصه تغییرات

| فایل | تغییر | اولویت |
|------|-------|--------|
| `src/pages/WrestlersListPage.tsx` | استفاده از useMemo برای visibleWrestlers | بحرانی |
| `src/components/WrestlerCard.tsx` | تغییر objectFit به cover + objectPosition | بحرانی |
| `src/components/ui/LazyImage.tsx` | افزودن prop objectPosition | مهم |
| `src/pages/WrestlerProfilePage.tsx` | بهبود IntroVideo با error handling | مهم |
| `src/pages/admin/AdminWrestlerEditPage.tsx` | هشدار فرمت ویدیو | اختیاری |

---

## نتایج مورد انتظار

```text
مشکل تعداد صفر:
┌────────────────────────────────────────┐
│  قبل: گاهی "۰ کشتی‌گیر" نمایش می‌داد    │
│  بعد: همیشه تعداد صحیح (۱۱ کشتی‌گیر)   │
└────────────────────────────────────────┘

مشکل تصویر باریک:
┌────────────────────────────────────────┐
│  قبل: تصویر باریک با فضای خالی اطراف   │
│  بعد: تصویر کامل container را پر کند   │
│       با صورت در بالای تصویر           │
└────────────────────────────────────────┘

مشکل کلیپ پخش نشدنی:
┌────────────────────────────────────────┐
│  قبل: صفحه خالی یا خطا                 │
│  بعد: دکمه پخش بزرگ + loading state   │
│       + پیام خطای مناسب               │
└────────────────────────────────────────┘
```
