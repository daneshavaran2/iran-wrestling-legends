
## برنامه افزودن انیمیشن‌های پیشرفته و تست آفلاین

---

### بخش اول: وضعیت فعلی پروژه

#### انیمیشن‌های موجود:
پروژه در حال حاضر دارای انیمیشن‌های CSS غنی است:
- `page-slide-up` - ورود کارت‌ها از پایین
- `page-fade-in` - محو شدن صفحه
- `float` - شناوری ملایم
- `pulse-glow` - درخشش نئونی
- `spark-float` - ذرات جرقه
- پارالاکس با لمس/موس (hook موجود)

#### وضعیت framer-motion:
- **نصب نشده** در `package.json`
- پیشنهاد: به جای نصب کتابخانه جدید، از CSS animations پیشرفته استفاده شود (سبک‌تر و سریع‌تر برای کیوسک)

---

### بخش دوم: انیمیشن‌های جدید برای کارت‌های منو

## ۲.۱ افزودن Keyframes جدید به CSS

```css
/* src/index.css - انیمیشن‌های جدید */

/* انیمیشن ورود Staggered با Scale */
@keyframes card-entrance {
  0% {
    opacity: 0;
    transform: translateY(60px) scale(0.8) rotateX(20deg);
    filter: blur(10px);
  }
  60% {
    opacity: 0.8;
    transform: translateY(-10px) scale(1.02) rotateX(-5deg);
    filter: blur(0);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1) rotateX(0deg);
    filter: blur(0);
  }
}

/* انیمیشن Hover Glow برای آیکون */
@keyframes icon-glow-pulse {
  0%, 100% {
    box-shadow: 0 0 15px hsl(20 100% 55% / 0.3);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 30px hsl(20 100% 55% / 0.6);
    transform: scale(1.05);
  }
}

/* انیمیشن Border Scan */
@keyframes border-scan {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* انیمیشن Press Effect */
@keyframes card-press {
  0% { transform: scale(1); }
  50% { transform: scale(0.96); }
  100% { transform: scale(1); }
}

/* انیمیشن Ripple Touch */
@keyframes touch-ripple {
  0% {
    transform: scale(0);
    opacity: 0.6;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}
```

## ۲.۲ کلاس‌های جدید برای کارت‌های منو

```css
/* کلاس کارت با انیمیشن ورود */
.menu-card-animated {
  opacity: 0;
  animation: card-entrance 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  will-change: transform, opacity;
}

/* تأخیر برای هر کارت */
.menu-card-animated:nth-child(1) { animation-delay: 0.1s; }
.menu-card-animated:nth-child(2) { animation-delay: 0.18s; }
.menu-card-animated:nth-child(3) { animation-delay: 0.26s; }
.menu-card-animated:nth-child(4) { animation-delay: 0.34s; }
.menu-card-animated:nth-child(5) { animation-delay: 0.42s; }
.menu-card-animated:nth-child(6) { animation-delay: 0.50s; }

/* افکت Hover پیشرفته */
.menu-card-hover {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.menu-card-hover:hover {
  transform: translateY(-12px) scale(1.03);
  box-shadow: 
    0 0 80px hsl(20 100% 50% / 0.3),
    0 20px 60px hsl(0 0% 0% / 0.7);
}

/* افکت Active/Press */
.menu-card-hover:active {
  animation: card-press 0.2s ease-out;
  transform: scale(0.97);
}

/* آیکون با انیمیشن Glow */
.icon-animated {
  transition: all 0.4s ease;
}

.menu-card-hover:hover .icon-animated {
  animation: icon-glow-pulse 1.5s ease-in-out infinite;
  color: hsl(20 100% 60%);
}
```

---

### بخش سوم: بروزرسانی کامپوننت MuseumHomePage

## ۳.۱ تغییرات در MenuCard

```typescript
// src/pages/MuseumHomePage.tsx

const MenuCard = forwardRef<HTMLDivElement, MenuCardProps>(
  function MenuCard({ title, icon, description, onClick, delay }, ref) {
    return (
      <ParallaxCard
        ref={ref}
        onClick={onClick}
        intensity={10}
        className="w-full text-right focus:outline-none menu-card-animated menu-card-hover"
      >
        <div 
          className="cyber-glass cyber-hud rounded-3xl p-5 md:p-6 xl:p-8 2xl:p-10 h-full flex flex-col items-center justify-center text-center min-h-[160px] md:min-h-[200px] xl:min-h-[260px] 2xl:min-h-[300px] group"
          style={{ animationDelay: `${delay}s` }}
        >
          {/* آیکون با انیمیشن Glow */}
          <div className="mb-3 md:mb-4 p-4 md:p-5 xl:p-6 rounded-2xl cyber-glass icon-animated text-primary group-hover:text-foreground group-hover:bg-primary/30 transition-all duration-500">
            {icon}
          </div>
          
          {/* عنوان با افکت Gradient */}
          <h2 className="text-lg md:text-xl xl:text-2xl 2xl:text-3xl font-bold mb-2 text-foreground group-hover:text-neon transition-all duration-500">
            {title}
          </h2>
          
          {/* توضیحات با Fade */}
          <p className="text-muted-foreground text-sm md:text-base xl:text-lg 2xl:text-xl group-hover:text-foreground/80 transition-colors duration-500">
            {description}
          </p>
        </div>
      </ParallaxCard>
    );
  }
);
```

## ۳.۲ انیمیشن Logo Entrance

```typescript
// افزودن انیمیشن برای لوگو و عنوان
<header className="text-center mb-6 md:mb-8 xl:mb-10 2xl:mb-12 flex-shrink-0 relative z-10">
  <div className="flex items-center justify-center gap-4 md:gap-6 xl:gap-8 2xl:gap-10 mb-2 md:mb-3">
    {/* Right Logo - با انیمیشن Float */}
    <img 
      src={federationLogo} 
      alt="لوگو فدراسیون کشتی" 
      className="h-16 md:h-20 xl:h-28 2xl:h-36 object-contain drop-shadow-[0_0_20px_hsl(20_100%_50%/0.3)] animate-float"
      style={{ animationDelay: '0s' }}
    />
    
    {/* Title - با انیمیشن Scale-in */}
    <h1 className="text-3xl md:text-5xl xl:text-6xl 2xl:text-7xl font-bold animate-scale-in">
      <span className="text-neon neon-glow">...</span>
    </h1>
    
    {/* Left Logo - با انیمیشن Float معکوس */}
    <img 
      src={federationLogo} 
      alt="لوگو فدراسیون کشتی" 
      className="h-16 md:h-20 xl:h-28 2xl:h-36 object-contain drop-shadow-[0_0_20px_hsl(20_100%_50%/0.3)] animate-float"
      style={{ animationDelay: '3s' }}
    />
  </div>
</header>
```

---

### بخش چهارم: دستورالعمل تست آفلاین

## ۴.۱ مراحل تست در مرورگر

### Chrome/Edge DevTools:
1. **F12** برای باز کردن DevTools
2. رفتن به تب **Network**
3. تیک زدن **Offline** در بالای لیست
4. **Refresh** صفحه

### موارد بررسی:
| مورد | نتیجه مورد انتظار |
|------|-------------------|
| صفحه اصلی | باید لود شود از کش |
| لیست کشتی‌گیران | داده‌ها از کش نمایش داده شوند |
| OfflineIndicator | باید در بالای صفحه ظاهر شود |
| تصاویر | تصاویر کش شده نمایش داده شوند |
| دکمه Refresh | با کلیک، تلاش برای اتصال مجدد |

### Safari:
1. **Develop** → **Enter Responsive Design Mode**
2. **Network Conditions** → **100% loss**

## ۴.۲ تست Background Sync

1. رفتن به تنظیمات آفلاین Admin
2. کلیک روی "درخواست همگام‌سازی"
3. فعال کردن Offline mode
4. غیرفعال کردن Offline
5. بررسی toast اعلان "داده‌ها همگام شد"

## ۴.۳ بررسی Service Worker

در DevTools → Application:
- **Service Workers**: باید فعال باشد
- **Cache Storage**: بررسی کش‌های موجود
  - `iran-wrestling-static-v4`
  - `iran-wrestling-api-v4`
  - `iran-wrestling-images-v4`

---

### بخش پنجم: خلاصه تغییرات

| فایل | تغییر | نوع |
|------|-------|-----|
| `src/index.css` | افزودن keyframes جدید: `card-entrance`, `icon-glow-pulse`, `border-scan` | انیمیشن |
| `src/index.css` | افزودن کلاس‌های `menu-card-animated`, `menu-card-hover`, `icon-animated` | استایل |
| `src/pages/MuseumHomePage.tsx` | اعمال کلاس‌های انیمیشن به MenuCard | کامپوننت |
| `src/pages/MuseumHomePage.tsx` | افزودن `animate-float` به لوگوها | انیمیشن |

---

### نتایج مورد انتظار

```text
انیمیشن‌های جدید:
┌────────────────────────────────────────────────┐
│  ✅ ورود کارت‌ها با افکت 3D و Blur            │
│  ✅ Staggered delay برای هر کارت               │
│  ✅ Hover effect با scale و shadow             │
│  ✅ Glow pulse برای آیکون‌ها                   │
│  ✅ Float animation برای لوگوها                │
│  ✅ Press feedback برای لمس                    │
└────────────────────────────────────────────────┘

تست آفلاین:
┌────────────────────────────────────────────────┐
│  ✅ صفحات از کش لود می‌شوند                   │
│  ✅ OfflineIndicator نمایش داده می‌شود         │
│  ✅ داده‌ها از localStorage خوانده می‌شوند     │
│  ✅ Background Sync بعد از آنلاین شدن کار      │
└────────────────────────────────────────────────┘
```

---

### چرا CSS بجای Framer-Motion؟

| معیار | CSS Animations | Framer-Motion |
|-------|---------------|---------------|
| حجم Bundle | **0 KB** | ~50 KB |
| عملکرد | **GPU accelerated** | JavaScript-based |
| سازگاری کیوسک | **بهینه** | نیاز به بهینه‌سازی |
| پیچیدگی | ساده | نیاز به یادگیری |
| نگهداری | **آسان** | وابستگی خارجی |

پروژه از قبل دارای سیستم انیمیشن غنی با CSS است و افزودن کتابخانه جدید غیرضروری است.
