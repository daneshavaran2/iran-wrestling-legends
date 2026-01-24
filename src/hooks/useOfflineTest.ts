import { useState, useCallback } from 'react';

export interface CacheTestResult {
  name: string;
  status: 'success' | 'error' | 'pending';
  itemCount: number;
  size: string;
}

export interface OfflineTestResult {
  serviceWorkerStatus: 'active' | 'installing' | 'waiting' | 'redundant' | 'none';
  cacheTests: CacheTestResult[];
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

      const isFullyOfflineReady = 
        swStatus === 'active' && 
        cacheTests.filter(t => t.status === 'success').length >= 3;

      const testResult: OfflineTestResult = {
        serviceWorkerStatus: swStatus,
        cacheTests,
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
