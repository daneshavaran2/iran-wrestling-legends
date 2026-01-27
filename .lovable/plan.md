

# رفع مشکلات ویدیو و کیبورد در حالت وب کیوسک

## خلاصه مشکلات
سه مشکل اصلی شناسایی شد:
1. **خطای ویدیو**: نمایش خطای "فرمت ویدیو پشتیبانی نمی‌شود یا فایل در دسترس نیست"
2. **کیبورد در دستیار**: کیبورد موقع تایپ در بخش چت دستیار فعال نمی‌شود
3. **کیبورد در لاگین**: کیبورد در صفحه ورود به داشبورد مدیریتی کار نمی‌کند

---

## ۱. رفع مشکل ویدیو

### مشکل فعلی
کامپوننت `IntroVideo` در صورت هرگونه خطا (شامل URL خالی، فرمت نادرست یا عدم دسترسی) پیام خطا نشان می‌دهد.

### راه‌حل
- اضافه کردن بررسی اولیه برای URL ویدیو قبل از رندر
- بهبود نمایش پیام خطا با دکمه "تلاش مجدد"
- پشتیبانی از فرمت‌های مختلف ویدیو با استفاده از `<source>` tags
- اضافه کردن پیام راهنما برای فرمت‌های پشتیبانی‌شده

### تغییرات در `src/pages/WrestlerProfilePage.tsx`

```typescript
// در IntroVideo component
function IntroVideo({ src, wrestlerName }: { src: string; wrestlerName: string }) {
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // اضافه کردن قابلیت retry
  const handleRetry = () => {
    setHasError(false);
    setRetryCount(prev => prev + 1);
  };

  // بررسی اولیه URL
  if (!src || src.trim() === '') {
    return (
      <ProfileEmptyState
        icon={<Play className="h-16 w-16" />}
        title={t('profile.empty.noIntro')}
      />
    );
  }

  if (hasError) {
    return (
      <ProfileEmptyState
        icon={<AlertCircle className="h-16 w-16 text-destructive" />}
        title="خطا در بارگذاری ویدیو"
        description="لطفاً از فرمت MP4 یا WebM استفاده کنید"
      />
      // اضافه کردن دکمه تلاش مجدد
    );
  }

  // استفاده از key برای force re-render در retry
  return (
    <div key={retryCount}>
      <video ... />
    </div>
  );
}
```

---

## ۲. رفع مشکل کیبورد در حالت کیوسک

### مشکل فعلی
در فایل `src/index.css` قوانین `.kiosk-mode` فقط برای `a` و `button` اجازه `pointer-events: auto` می‌دهد. این باعث می‌شود `input` و `textarea` در حالت کیوسک قابل کلیک/فوکوس نباشند.

```css
/* وضعیت فعلی - مشکل‌ساز */
.kiosk-mode a,
.kiosk-mode button {
  pointer-events: auto;
}
```

### راه‌حل
اضافه کردن `input`، `textarea` و `select` به لیست عناصر با `pointer-events: auto`

### تغییرات در `src/index.css`

```css
/* وضعیت جدید - رفع شده */
.kiosk-mode a,
.kiosk-mode button,
.kiosk-mode input,
.kiosk-mode textarea,
.kiosk-mode select {
  pointer-events: auto;
  user-select: auto;
  -webkit-user-select: auto;
}
```

---

## ۳. بهبود فوکوس در ChatAssistant

### راه‌حل اضافی
اضافه کردن `autoFocus` attribute و مدیریت بهتر focus برای کیبورد مجازی

### تغییرات در `src/components/ChatAssistant.tsx`

```typescript
<Input
  ref={inputRef}
  value={inputValue}
  onChange={(e) => setInputValue(e.target.value)}
  onKeyPress={handleKeyPress}
  placeholder={t('assistant.placeholder')}
  className="flex-1 bg-muted/30 border-gold/20 focus:border-gold/50"
  disabled={isLoading}
  autoComplete="off"
  autoCorrect="off"
  inputMode="text"  // اضافه شده - کمک به نمایش کیبورد مجازی
/>
```

---

## لیست فایل‌های ویرایشی

| فایل | تغییر |
|------|-------|
| `src/index.css` | اضافه کردن input/textarea به قوانین kiosk-mode |
| `src/pages/WrestlerProfilePage.tsx` | بهبود error handling و retry برای ویدیو |
| `src/components/ChatAssistant.tsx` | اضافه کردن inputMode برای کیبورد مجازی |

---

## بخش فنی

### علت مشکل کیبورد
CSS rule زیر مانع از تعامل با input ها می‌شود:

```css
.kiosk-mode {
  user-select: none;  /* این باعث مشکل می‌شود */
}
```

برای input ها باید `user-select: auto` اعمال شود تا کاربر بتواند متن انتخاب و تایپ کند.

### علت مشکل ویدیو
خطای نمایش داده شده می‌تواند به دلایل زیر باشد:
1. URL ویدیو نامعتبر یا خالی
2. فرمت ویدیو پشتیبانی نشده (مثلاً MOV)
3. مشکل CORS در دسترسی به فایل
4. فایل حذف شده یا جابجا شده

### تست پس از اعمال تغییرات
1. باز کردن برنامه در حالت کیوسک
2. رفتن به پروفایل یک کشتی‌گیر با ویدیو
3. کلیک روی input چت دستیار و تایپ
4. رفتن به صفحه login و تست تایپ در فیلدها

