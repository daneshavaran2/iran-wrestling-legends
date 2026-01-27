
# بهینه‌سازی کیبورد مجازی و افزودن قابلیت‌های جدید

## خلاصه تغییرات
۴ بهبود اصلی پیاده‌سازی خواهد شد:
1. **بزرگ‌سازی دکمه‌های کیبورد** برای نمایشگرهای ۵۵ اینچی
2. **صدای کلیک تایپ** برای تجربه کاربری بهتر
3. **افزودن کیبورد عربی** به layouts موجود
4. **تشخیص خودکار زبان** در دستیار و پاسخ‌دهی به همان زبان

---

## ۱. بزرگ‌سازی کیبورد برای کیوسک ۵۵ اینچی

### تغییرات در `src/components/VirtualKeyboard.tsx`

```text
وضعیت فعلی        →    وضعیت جدید
─────────────────────────────────────
h-12 sm:h-14      →    h-14 md:h-16 lg:h-20
w-10 sm:w-12      →    w-12 md:w-14 lg:w-16
text-lg           →    text-xl lg:text-2xl
min-w-[80px]      →    min-w-[100px] lg:min-w-[130px]
gap-1.5 sm:gap-2  →    gap-2 md:gap-3 lg:gap-4
p-3 sm:p-4        →    p-4 md:p-6 lg:p-8
```

### نتیجه
دکمه‌ها در نمایشگرهای بزرگ ۳۰-۵۰٪ بزرگتر خواهند بود

---

## ۲. افزودن صدای کلیک

### ایجاد هوک جدید `src/hooks/useKeyboardSound.ts`

```typescript
export function useKeyboardSound() {
  const audioContext = useRef<AudioContext | null>(null);

  const playClick = useCallback(() => {
    // ایجاد صدای کلیک با Web Audio API
    // فرکانس: 800Hz
    // مدت: 50ms
    // نوع: sine wave
  }, []);

  return { playClick };
}
```

### مزایا
- استفاده از Web Audio API بدون نیاز به فایل خارجی
- سریع و بدون تاخیر
- قابل تنظیم (فعال/غیرفعال)

---

## ۳. افزودن کیبورد عربی

### تغییرات در `src/components/VirtualKeyboard.tsx`

```typescript
const ARABIC_KEYS = [
  ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج'],
  ['ش', 'س', 'ي', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ك', 'ط'],
  ['ئ', 'ء', 'ؤ', 'ر', 'ى', 'ة', 'و', 'ز', 'ظ'],
];

const ARABIC_KEYS_SHIFT = [
  ['ً', 'ٌ', 'ٍ', 'ّ', 'َ', 'ُ', 'ِ', 'ْ', 'آ', 'أ', 'إ'],
  ['ذ', 'ـ', '»', '«', '،', '؟', '!', '؛', ':', 'ذ', 'د'],
  ['ۀ', '"', "'", '.', '٪', '×', '÷', '-', '+'],
];

// نوع layout جدید
type Layout = 'persian' | 'english' | 'arabic' | 'numbers';
```

### رابط کاربری
- افزودن دکمه **"عربی"** بین فارسی و انگلیسی

---

## ۴. تشخیص خودکار زبان در دستیار

### روش کار
شناسایی زبان متن کاربر با regex و ارسال به Edge Function:

```typescript
function detectLanguage(text: string): 'fa' | 'en' | 'ar' {
  const arabicRegex = /[\u0600-\u06FF]/;
  const persianSpecific = /[پچژگک]/;
  
  if (persianSpecific.test(text)) return 'fa';
  if (arabicRegex.test(text)) return 'ar';
  return 'en';
}
```

### تغییرات در `src/hooks/useChatAssistant.ts`

```typescript
const sendMessage = async (content: string) => {
  // تشخیص زبان از متن کاربر
  const detectedLanguage = detectLanguage(content);
  
  // ارسال با زبان تشخیص داده شده
  body: JSON.stringify({
    messages: [...],
    language: detectedLanguage, // به جای زبان سیستم
    stream: true,
  }),
};
```

---

## لیست فایل‌های ویرایشی

| فایل | تغییرات |
|------|---------|
| `src/components/VirtualKeyboard.tsx` | بزرگ‌سازی + کیبورد عربی + صدا |
| `src/hooks/useKeyboardSound.ts` | **ایجاد جدید** - هوک صدای کلیک |
| `src/hooks/useVirtualKeyboard.ts` | افزودن نوع `arabic` به layout |
| `src/components/VirtualKeyboardProvider.tsx` | پشتیبانی از layout جدید |
| `src/hooks/useChatAssistant.ts` | تشخیص خودکار زبان |

---

## بخش فنی

### تشخیص زبان - جزئیات

```text
Persian-specific chars: پ چ ژ گ ک
Arabic Unicode range:   \u0600-\u06FF  
Persian uses same range + specific letters
```

### Web Audio API - ساختار صدای کلیک

```text
┌─────────────────────────────────────┐
│   Oscillator (800Hz, sine)          │
│           ↓                         │
│   GainNode (0.15 → 0 در 50ms)       │
│           ↓                         │
│   AudioContext.destination          │
└─────────────────────────────────────┘
```

### CSS Breakpoints برای کیوسک

```text
sm: 640px   → تبلت
md: 768px   → لپ‌تاپ
lg: 1024px  → نمایشگر بزرگ (کیوسک)
```

---

## تست پس از پیاده‌سازی

1. ✅ باز کردن در حالت کیوسک و تایید اندازه دکمه‌ها
2. ✅ تست صدای کلیک هنگام تایپ
3. ✅ تست تغییر بین ۴ زبان کیبورد
4. ✅ تایپ پیام فارسی و دریافت پاسخ فارسی
5. ✅ تایپ پیام عربی و دریافت پاسخ عربی
6. ✅ تایپ پیام انگلیسی و دریافت پاسخ انگلیسی
