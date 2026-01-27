
## برنامه تست کامل روی سرور Liara و افزودن Background Sync با Service Worker

---

### بخش اول: بهبود Service Worker برای Background Sync

#### وضعیت فعلی:
Service Worker (`public/sw.js`) دارای:
- Stale While Revalidate برای API
- Cache First برای تصاویر
- Navigation Preload
- پیام‌رسانی با اپلیکیشن

**نقاط ضعف:**
1. Background Sync فقط یک placeholder است (خط 354-357)
2. Periodic Sync پشتیبانی نمی‌شود
3. اتصال مجدد به اینترنت باعث refresh خودکار نمی‌شود

---

### ۱.۱ پیاده‌سازی کامل Background Sync

```javascript
// public/sw.js - افزودن قابلیت‌های جدید

// ثبت داده‌های pending برای sync
const PENDING_SYNC_KEY = 'pending_sync_requests';

// ذخیره درخواست‌های ناموفق برای sync بعدی
async function savePendingSync(data) {
  const pending = await getPendingSyncs();
  pending.push({
    ...data,
    timestamp: Date.now(),
    id: crypto.randomUUID()
  });
  
  // ذخیره در IndexedDB
  const db = await openSyncDB();
  await db.put('pending', pending);
}

// اجرای Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-museum-data') {
    event.waitUntil(syncMuseumData());
  }
  if (event.tag === 'sync-images') {
    event.waitUntil(syncImages());
  }
});

// Periodic Background Sync (برای مرورگرهای پشتیبانی‌کننده)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'museum-data-sync') {
    event.waitUntil(syncMuseumData());
  }
});

async function syncMuseumData() {
  console.log('[SW] Background sync: Museum data');
  
  try {
    // Fetch تمام داده‌ها از Supabase
    const endpoints = [
      'wrestlers?select=*',
      'achievements?select=*',
      'wrestler_media?select=*',
      'history_sections?select=*',
      'buildings?select=*',
      'books?select=*',
      'albums?select=*',
    ];
    
    const cache = await caches.open(API_CACHE);
    
    for (const endpoint of endpoints) {
      const url = `https://etbekvhdroqiddcteqdq.supabase.co/rest/v1/${endpoint}`;
      try {
        const response = await fetch(url, {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
          }
        });
        if (response.ok) {
          await cache.put(url, response.clone());
        }
      } catch (e) {
        console.log(`[SW] Failed to sync ${endpoint}:`, e);
      }
    }
    
    // اطلاع به کلاینت
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({ 
        type: 'BACKGROUND_SYNC_COMPLETE',
        timestamp: Date.now()
      });
    });
    
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}
```

---

### ۱.۲ ایجاد Hook برای مدیریت Background Sync

```typescript
// src/hooks/useBackgroundSync.ts

export function useBackgroundSync() {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'pending' | 'syncing'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // ثبت Periodic Background Sync
  useEffect(() => {
    const registerPeriodicSync = async () => {
      if (!('serviceWorker' in navigator) || !('periodicSync' in ServiceWorkerRegistration.prototype)) {
        console.log('Periodic Background Sync not supported');
        return;
      }
      
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.periodicSync.register('museum-data-sync', {
          minInterval: 24 * 60 * 60 * 1000, // 24 ساعت
        });
        console.log('Periodic sync registered');
      } catch (error) {
        console.log('Periodic sync registration failed:', error);
      }
    };

    registerPeriodicSync();
  }, []);

  // درخواست sync دستی
  const requestSync = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
      console.log('Background Sync not supported');
      return false;
    }
    
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-museum-data');
      setSyncStatus('pending');
      return true;
    } catch (error) {
      console.error('Sync registration failed:', error);
      return false;
    }
  }, []);

  // گوش دادن به پیام‌های Service Worker
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'BACKGROUND_SYNC_COMPLETE') {
        setSyncStatus('idle');
        setLastSyncTime(new Date(event.data.timestamp));
        toast.success('داده‌ها در پس‌زمینه به‌روز شد', {
          icon: '🔄',
          duration: 3000,
        });
      }
      if (event.data?.type === 'SYNC_STARTED') {
        setSyncStatus('syncing');
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleMessage);
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, []);

  return {
    syncStatus,
    lastSyncTime,
    requestSync,
    isSupported: 'SyncManager' in window,
  };
}
```

---

### بخش دوم: رفع مشکلات اتصال سرور Liara

#### ۲.۱ بهبود Connection Resilience

**مشکل:** سرور Liara ممکن است اتصال کندتری به Supabase داشته باشد

```typescript
// src/lib/supabase.ts - افزودن retry با exponential backoff

export async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetchFn();
    } catch (error) {
      lastError = error as Error;
      
      // Exponential backoff
      const delay = baseDelay * Math.pow(2, i);
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}
```

#### ۲.۲ Health Check Endpoint

```typescript
// افزودن تست اتصال سریع
export async function healthCheck(): Promise<{
  status: 'healthy' | 'degraded' | 'offline';
  latency: number;
}> {
  const start = Date.now();
  
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 3000);
    
    const { error } = await supabase
      .from('app_settings')
      .select('id')
      .limit(1)
      .abortSignal(controller.signal);
    
    const latency = Date.now() - start;
    
    if (error) {
      return { status: 'degraded', latency };
    }
    
    return {
      status: latency < 2000 ? 'healthy' : 'degraded',
      latency
    };
  } catch {
    return { status: 'offline', latency: 0 };
  }
}
```

---

### بخش سوم: نمایش وضعیت Sync در UI

#### ۳.۱ کامپوننت وضعیت Sync

```typescript
// src/components/SyncStatusIndicator.tsx

function SyncStatusIndicator() {
  const { syncStatus, lastSyncTime } = useBackgroundSync();
  const { isOffline } = useOfflineData();
  
  if (syncStatus === 'syncing') {
    return (
      <div className="flex items-center gap-2 text-primary">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span className="text-xs">در حال همگام‌سازی...</span>
      </div>
    );
  }
  
  if (isOffline) {
    return (
      <div className="flex items-center gap-2 text-yellow-500">
        <WifiOff className="h-4 w-4" />
        <span className="text-xs">آفلاین</span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-2 text-green-500">
      <CloudCheck className="h-4 w-4" />
      <span className="text-xs">متصل</span>
    </div>
  );
}
```

#### ۳.۲ یکپارچه‌سازی با AdminOfflineSettingsPage

افزودن بخش "Background Sync" به صفحه تنظیمات آفلاین:

```tsx
{/* Background Sync Section */}
<GlassCard className="p-6">
  <div className="flex items-center gap-3 mb-6">
    <CloudSync className="h-6 w-6 text-primary" />
    <h2 className="text-xl font-semibold">همگام‌سازی پس‌زمینه</h2>
  </div>
  
  <div className="space-y-4">
    {/* وضعیت پشتیبانی */}
    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
      <span>پشتیبانی مرورگر</span>
      <span className={isSupported ? 'text-green-500' : 'text-yellow-500'}>
        {isSupported ? 'پشتیبانی می‌شود' : 'پشتیبانی نمی‌شود'}
      </span>
    </div>
    
    {/* آخرین همگام‌سازی */}
    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
      <span>آخرین همگام‌سازی پس‌زمینه</span>
      <span>{lastSyncTime?.toLocaleString('fa-IR') || 'هنوز انجام نشده'}</span>
    </div>
    
    {/* دکمه درخواست sync */}
    <Button onClick={requestSync} disabled={syncStatus !== 'idle'}>
      <CloudSync className="h-4 w-4 ml-2" />
      درخواست همگام‌سازی
    </Button>
  </div>
</GlassCard>
```

---

### بخش چهارم: تست‌های سناریوی مختلف شبکه

#### ۴.۱ افزودن Network Condition Testing

```typescript
// src/hooks/useNetworkCondition.ts

interface NetworkCondition {
  type: 'excellent' | 'good' | 'fair' | 'poor' | 'offline';
  effectiveType: string;
  downlink: number;
  rtt: number;
}

export function useNetworkCondition() {
  const [condition, setCondition] = useState<NetworkCondition>({
    type: 'good',
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
  });

  useEffect(() => {
    const updateCondition = () => {
      if (!navigator.onLine) {
        setCondition(prev => ({ ...prev, type: 'offline' }));
        return;
      }
      
      // @ts-ignore - Network Information API
      const connection = navigator.connection || navigator.mozConnection;
      
      if (connection) {
        const type = connection.effectiveType === '4g' ? 'excellent' :
                     connection.effectiveType === '3g' ? 'good' :
                     connection.effectiveType === '2g' ? 'fair' : 'poor';
        
        setCondition({
          type,
          effectiveType: connection.effectiveType,
          downlink: connection.downlink || 0,
          rtt: connection.rtt || 0,
        });
      }
    };

    updateCondition();
    
    window.addEventListener('online', updateCondition);
    window.addEventListener('offline', updateCondition);
    
    return () => {
      window.removeEventListener('online', updateCondition);
      window.removeEventListener('offline', updateCondition);
    };
  }, []);

  return condition;
}
```

---

### خلاصه تغییرات

| فایل | تغییر | اولویت |
|------|-------|--------|
| `public/sw.js` | پیاده‌سازی کامل Background Sync و Periodic Sync | بحرانی |
| `src/hooks/useBackgroundSync.ts` | ایجاد hook جدید برای مدیریت background sync | بحرانی |
| `src/lib/supabase.ts` | افزودن fetchWithRetry و healthCheck | مهم |
| `src/hooks/useNetworkCondition.ts` | ایجاد hook برای تشخیص وضعیت شبکه | مهم |
| `src/components/SyncStatusIndicator.tsx` | کامپوننت نمایش وضعیت sync | مهم |
| `src/pages/admin/AdminOfflineSettingsPage.tsx` | افزودن بخش Background Sync | بهبود |

---

### معماری Background Sync

```text
┌─────────────────────────────────────────────────────────────────┐
│                        کاربر آنلاین                              │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────────────┐   │
│  │   App    │───▶│ SW Message  │───▶│ Service Worker      │   │
│  └──────────┘    └──────────────┘    │ - Cache API calls   │   │
│                                       │ - Cache Images      │   │
│                                       └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        کاربر آفلاین                              │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────────────┐   │
│  │   App    │───▶│ Cache API   │───▶│ Cached Data         │   │
│  └──────────┘    └──────────────┘    └──────────────────────┘   │
│       │                                                          │
│       └──▶ Register sync event ──▶ Queued for later             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     برگشت آنلاین                                 │
│  ┌──────────────────────┐    ┌─────────────────────────────┐    │
│  │ Service Worker       │    │ Background Sync Event       │    │
│  │ sync event fires     │───▶│ - Fetch fresh data          │    │
│  └──────────────────────┘    │ - Update cache              │    │
│                               │ - Notify app                │    │
│                               └─────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

### نتایج مورد انتظار

```text
عملکرد روی سرور Liara:
┌──────────────────────────────────────────────────────┐
│  ✅ اتصال اولیه: تلاش مجدد خودکار (3 بار)           │
│  ✅ قطع اتصال: نمایش داده‌های کش شده                │
│  ✅ برگشت آنلاین: sync خودکار در پس‌زمینه           │
│  ✅ شبکه کند: timeout مناسب + fallback             │
└──────────────────────────────────────────────────────┘

Background Sync:
┌──────────────────────────────────────────────────────┐
│  ✅ ثبت Periodic Sync (24 ساعته)                    │
│  ✅ Sync دستی با یک کلیک                            │
│  ✅ اعلان موفقیت sync                               │
│  ✅ ذخیره timestamp آخرین sync                      │
└──────────────────────────────────────────────────────┘
```
