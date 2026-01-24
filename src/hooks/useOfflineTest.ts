import { useState, useCallback } from 'react';

export interface CacheTestResult {
  name: string;
  status: 'success' | 'error' | 'pending';
  itemCount: number;
  size: string;
}

export interface PageTestResult {
  path: string;
  name: string;
  status: 'success' | 'error' | 'pending';
  hasCachedData: boolean;
}

export interface DataIntegrity {
  section: string;
  label: string;
  cachedCount: number;
  totalCount: number;
  percentage: number;
  status: 'complete' | 'partial' | 'empty';
}

export interface OfflineTestResult {
  serviceWorkerStatus: 'active' | 'installing' | 'waiting' | 'redundant' | 'none';
  cacheTests: CacheTestResult[];
  pageTests: PageTestResult[];
  dataIntegrity: DataIntegrity[];
  recommendations: string[];
  isFullyOfflineReady: boolean;
  totalCacheSize: string;
  lastTestTime: string | null;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '۰ بایت';
  const k = 1024;
  const sizes = ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
  const persianValue = value.toString().replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
  return `${persianValue} ${sizes[i]}`;
};

const toPersianNumber = (num: number): string => {
  return num.toString().replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
};

const CACHE_KEYS = {
  WRESTLERS: 'museum_wrestlers_cache',
  HISTORY: 'museum_history_cache',
  BUILDINGS: 'museum_buildings_cache',
  BOOKS: 'museum_books_cache',
  ALBUMS: 'museum_albums_cache',
};

export function useOfflineTest() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<OfflineTestResult | null>(null);

  const runTest = useCallback(async (): Promise<OfflineTestResult> => {
    setIsRunning(true);

    try {
      // Check Service Worker status
      let swStatus: OfflineTestResult['serviceWorkerStatus'] = 'none';
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          if (registration.active) swStatus = 'active';
          else if (registration.installing) swStatus = 'installing';
          else if (registration.waiting) swStatus = 'waiting';
        }
      }

      // Test all caches
      const cacheTests: CacheTestResult[] = [];
      const cacheNames = [
        { name: 'wrestling-static-v3', label: 'کش استاتیک' },
        { name: 'wrestling-api-v2', label: 'کش API' },
        { name: 'wrestling-images-v2', label: 'کش تصاویر' },
        { name: 'wrestling-dynamic-v1', label: 'کش داینامیک' },
      ];

      let totalSize = 0;

      for (const { name, label } of cacheNames) {
        try {
          const cache = await caches.open(name);
          const keys = await cache.keys();
          
          // Estimate cache size
          let cacheSize = 0;
          for (const request of keys.slice(0, 50)) { // Limit to avoid performance issues
            try {
              const response = await cache.match(request);
              if (response) {
                const blob = await response.clone().blob();
                cacheSize += blob.size;
              }
            } catch {
              // Skip if can't read
            }
          }
          
          // Extrapolate if we limited
          if (keys.length > 50) {
            cacheSize = Math.round(cacheSize * (keys.length / 50));
          }
          
          totalSize += cacheSize;

          cacheTests.push({
            name: label,
            status: keys.length > 0 ? 'success' : 'pending',
            itemCount: keys.length,
            size: formatBytes(cacheSize),
          });
        } catch {
          cacheTests.push({
            name: label,
            status: 'error',
            itemCount: 0,
            size: '۰ بایت',
          });
        }
      }

      // Check localStorage
      let localStorageSize = 0;
      try {
        for (const key of Object.keys(localStorage)) {
          localStorageSize += localStorage.getItem(key)?.length || 0;
        }
        localStorageSize *= 2; // UTF-16 encoding
        totalSize += localStorageSize;

        cacheTests.push({
          name: 'حافظه محلی',
          status: localStorageSize > 1000 ? 'success' : 'pending',
          itemCount: Object.keys(localStorage).length,
          size: formatBytes(localStorageSize),
        });
      } catch {
        cacheTests.push({
          name: 'حافظه محلی',
          status: 'error',
          itemCount: 0,
          size: '۰ بایت',
        });
      }

      // Test page caching
      const pageTests: PageTestResult[] = [
        { path: '/', name: 'صفحه اصلی', status: 'pending', hasCachedData: false },
        { path: '/wrestlers', name: 'لیست کشتی‌گیرها', status: 'pending', hasCachedData: false },
        { path: '/history', name: 'تاریخچه', status: 'pending', hasCachedData: false },
        { path: '/buildings', name: 'بناها', status: 'pending', hasCachedData: false },
        { path: '/books', name: 'کتاب‌ها', status: 'pending', hasCachedData: false },
        { path: '/albums', name: 'آلبوم‌ها', status: 'pending', hasCachedData: false },
      ];

      // Check if pages have cached data
      for (const page of pageTests) {
        try {
          const cacheKey = Object.entries(CACHE_KEYS).find(([key]) => 
            page.path.includes(key.toLowerCase())
          )?.[1];
          
          if (cacheKey) {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
              const data = JSON.parse(cached);
              if (Array.isArray(data) && data.length > 0) {
                page.status = 'success';
                page.hasCachedData = true;
              }
            }
          }
          
          // Home page always works
          if (page.path === '/') {
            page.status = 'success';
            page.hasCachedData = true;
          }
        } catch {
          page.status = 'error';
        }
      }

      // Check data integrity
      const dataIntegrity: DataIntegrity[] = [];
      const integrityChecks = [
        { key: CACHE_KEYS.WRESTLERS, label: 'کشتی‌گیرها', section: 'wrestlers' },
        { key: CACHE_KEYS.HISTORY, label: 'تاریخچه', section: 'history' },
        { key: CACHE_KEYS.BUILDINGS, label: 'بناها', section: 'buildings' },
        { key: CACHE_KEYS.BOOKS, label: 'کتاب‌ها', section: 'books' },
        { key: CACHE_KEYS.ALBUMS, label: 'آلبوم‌ها', section: 'albums' },
      ];

      for (const { key, label, section } of integrityChecks) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const data = JSON.parse(cached);
            const count = Array.isArray(data) ? data.length : 0;
            dataIntegrity.push({
              section,
              label,
              cachedCount: count,
              totalCount: count, // We don't have total from server in offline mode
              percentage: count > 0 ? 100 : 0,
              status: count > 0 ? 'complete' : 'empty',
            });
          } else {
            dataIntegrity.push({
              section,
              label,
              cachedCount: 0,
              totalCount: 0,
              percentage: 0,
              status: 'empty',
            });
          }
        } catch {
          dataIntegrity.push({
            section,
            label,
            cachedCount: 0,
            totalCount: 0,
            percentage: 0,
            status: 'empty',
          });
        }
      }

      // Generate recommendations
      const recommendations: string[] = [];
      
      if (swStatus !== 'active') {
        recommendations.push('Service Worker فعال نیست. صفحه را رفرش کنید.');
      }
      
      const emptySections = dataIntegrity.filter(d => d.status === 'empty');
      if (emptySections.length > 0) {
        recommendations.push(`بخش‌های ${emptySections.map(s => s.label).join('، ')} دانلود نشده‌اند.`);
      }
      
      const imageCache = cacheTests.find(c => c.name === 'کش تصاویر');
      if (!imageCache || imageCache.itemCount < 10) {
        recommendations.push('تعداد تصاویر کش شده کم است. دوباره دانلود کنید.');
      }

      if (recommendations.length === 0) {
        recommendations.push('سیستم آماده کار در حالت آفلاین است! ✓');
      }

      const isFullyOfflineReady = 
        swStatus === 'active' && 
        cacheTests.filter(t => t.status === 'success').length >= 3 &&
        dataIntegrity.filter(d => d.status === 'complete').length >= 3;

      const testResult: OfflineTestResult = {
        serviceWorkerStatus: swStatus,
        cacheTests,
        pageTests,
        dataIntegrity,
        recommendations,
        isFullyOfflineReady,
        totalCacheSize: formatBytes(totalSize),
        lastTestTime: new Date().toLocaleString('fa-IR'),
      };

      setResult(testResult);
      return testResult;
    } finally {
      setIsRunning(false);
    }
  }, []);

  const getSwStatusLabel = (status: OfflineTestResult['serviceWorkerStatus']): string => {
    const labels = {
      active: 'فعال',
      installing: 'در حال نصب',
      waiting: 'در انتظار',
      redundant: 'غیرفعال',
      none: 'نصب نشده',
    };
    return labels[status];
  };

  const getSwStatusColor = (status: OfflineTestResult['serviceWorkerStatus']): string => {
    const colors = {
      active: 'text-green-500',
      installing: 'text-yellow-500',
      waiting: 'text-blue-500',
      redundant: 'text-red-500',
      none: 'text-muted-foreground',
    };
    return colors[status];
  };

  return {
    runTest,
    isRunning,
    result,
    getSwStatusLabel,
    getSwStatusColor,
    toPersianNumber,
  };
}
