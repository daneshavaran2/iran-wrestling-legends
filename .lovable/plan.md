
## برنامه رفع هشدارهای ref در کامپوننت‌های MenuCard و ParallaxCard

---

### تشخیص مشکل

از کنسول لاگ‌ها:
```
Warning: Function components cannot be given refs.
Check the render method of `MuseumHomePage`. → MenuCard
Check the render method of `MenuCard`. → ParallaxCard
```

**علت مشکل:**
React سعی می‌کند ref را به این کامپوننت‌های function پاس دهد، اما آن‌ها با `forwardRef` پیچیده نشده‌اند.

```text
┌──────────────────────────────────────────────────────────────┐
│  MuseumHomePage                                              │
│       │                                                      │
│       ▼ (ref passed?)                                        │
│  MenuCard (Function Component - no forwardRef) ❌            │
│       │                                                      │
│       ▼                                                      │
│  ParallaxCard (Function Component - no forwardRef) ❌        │
│       │                                                      │
│       ▼                                                      │
│  <div ref={ref}> (useParallax internal ref)                 │
└──────────────────────────────────────────────────────────────┘
```

---

### راه‌حل: استفاده از React.forwardRef

## بخش ۱: تبدیل ParallaxCard به forwardRef

### ۱.۱ بروزرسانی `src/components/ui/ParallaxCard.tsx`

```typescript
import React, { forwardRef } from 'react';
import { useParallax } from '@/hooks/useParallax';
import { cn } from '@/lib/utils';

interface ParallaxCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  onClick?: () => void;
}

export const ParallaxCard = forwardRef<HTMLDivElement, ParallaxCardProps>(
  function ParallaxCard({ children, className, intensity = 12, onClick }, externalRef) {
    const { ref: internalRef, style, handlers } = useParallax(intensity);
    
    // ترکیب ref داخلی با ref خارجی
    const combinedRef = (node: HTMLDivElement | null) => {
      // @ts-ignore - set internal ref
      internalRef.current = node;
      
      // Forward to external ref if provided
      if (typeof externalRef === 'function') {
        externalRef(node);
      } else if (externalRef) {
        externalRef.current = node;
      }
    };

    return (
      <div
        ref={combinedRef}
        style={style}
        onClick={onClick}
        className={cn('transform-gpu cursor-pointer', className)}
        {...handlers}
      >
        {children}
      </div>
    );
  }
);

ParallaxCard.displayName = 'ParallaxCard';
```

**تغییرات کلیدی:**
- استفاده از `forwardRef` برای دریافت ref از والد
- ایجاد `combinedRef` برای ترکیب ref داخلی (از useParallax) با ref خارجی
- افزودن `displayName` برای خوانایی بهتر در DevTools

---

## بخش ۲: تبدیل MenuCard به forwardRef

### ۲.۱ بروزرسانی `MenuCard` در `src/pages/MuseumHomePage.tsx`

```typescript
import React, { forwardRef } from 'react';

interface MenuCardProps {
  title: string;
  icon: React.ReactNode;
  description: string;
  onClick: () => void;
  delay: number;
}

const MenuCard = forwardRef<HTMLDivElement, MenuCardProps>(
  function MenuCard({ title, icon, description, onClick, delay }, ref) {
    return (
      <ParallaxCard
        ref={ref}
        onClick={onClick}
        intensity={10}
        className="w-full text-right focus:outline-none page-slide-up"
      >
        <div 
          className="cyber-glass cyber-hud rounded-3xl p-5 md:p-6 xl:p-8 2xl:p-10 h-full flex flex-col items-center justify-center text-center min-h-[160px] md:min-h-[200px] xl:min-h-[260px] 2xl:min-h-[300px] group active:scale-[0.98] transition-transform"
          style={{ animationDelay: `${delay}s` }}
        >
          <div className="mb-3 md:mb-4 p-4 md:p-5 xl:p-6 rounded-2xl cyber-glass text-primary group-hover:text-foreground group-hover:bg-primary/30 transition-all duration-300">
            {icon}
          </div>
          <h2 className="text-lg md:text-xl xl:text-2xl 2xl:text-3xl font-bold mb-2 text-foreground group-hover:text-primary transition-all duration-300">
            {title}
          </h2>
          <p className="text-muted-foreground text-sm md:text-base xl:text-lg 2xl:text-xl">
            {description}
          </p>
        </div>
      </ParallaxCard>
    );
  }
);

MenuCard.displayName = 'MenuCard';
```

---

## بخش ۳: بروزرسانی useParallax hook

### ۳.۱ بهبود `src/hooks/useParallax.ts` برای پشتیبانی از ref forwarding

```typescript
import { useState, useCallback, useRef, MutableRefObject } from 'react';

interface ParallaxState {
  rotateX: number;
  rotateY: number;
  scale: number;
}

export function useParallax(intensity: number = 15) {
  const [transform, setTransform] = useState<ParallaxState>({
    rotateX: 0,
    rotateY: 0,
    scale: 1,
  });
  const ref = useRef<HTMLDivElement>(null);

  // ... existing handlers remain the same

  const style: React.CSSProperties = {
    transform: `perspective(1000px) rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg) scale(${transform.scale})`,
    transition: 'transform 0.15s ease-out',
    transformStyle: 'preserve-3d',
  };

  return {
    ref,
    style,
    handlers: {
      onTouchMove: handleTouchMove,
      onMouseMove: handleMouseMove,
      onMouseLeave: handleLeave,
      onTouchEnd: handleLeave,
    },
  };
}
```

---

### خلاصه تغییرات

| فایل | تغییر | اولویت |
|------|-------|--------|
| `src/components/ui/ParallaxCard.tsx` | تبدیل به forwardRef با ترکیب ref‌ها | بحرانی |
| `src/pages/MuseumHomePage.tsx` | تبدیل MenuCard به forwardRef | بحرانی |

---

### جریان داده بعد از رفع

```text
┌──────────────────────────────────────────────────────────────┐
│  MuseumHomePage                                              │
│       │                                                      │
│       ▼ (ref can be passed)                                  │
│  MenuCard (forwardRef ✅)                                    │
│       │                                                      │
│       ▼ (ref forwarded)                                      │
│  ParallaxCard (forwardRef ✅)                                │
│       │                                                      │
│       ▼ (combined with internal ref)                         │
│  <div ref={combinedRef}> ✅                                  │
└──────────────────────────────────────────────────────────────┘
```

---

### نتایج مورد انتظار

```text
قبل:
┌────────────────────────────────────────────────┐
│  ⚠️ Warning: Function components cannot be    │
│     given refs. Check MenuCard                 │
│  ⚠️ Warning: Function components cannot be    │
│     given refs. Check ParallaxCard             │
└────────────────────────────────────────────────┘

بعد:
┌────────────────────────────────────────────────┐
│  ✅ هیچ هشداری در کنسول نمایش داده نمی‌شود     │
│  ✅ کامپوننت‌ها به درستی ref دریافت می‌کنند     │
│  ✅ افکت پارالاکس همچنان کار می‌کند             │
└────────────────────────────────────────────────┘
```

---

### تست عملکرد آفلاین

پس از اعمال تغییرات، برای تست آفلاین:

1. **باز کردن DevTools** (F12 یا Cmd+Option+I)
2. **رفتن به تب Network**
3. **تیک زدن گزینه "Offline"**
4. **بررسی موارد زیر:**
   - نمایش OfflineIndicator در بالای صفحه
   - امکان مرور داده‌های کش شده
   - نمایش toast آفلاین
   - کار کردن Background Sync بعد از برگشت آنلاین
