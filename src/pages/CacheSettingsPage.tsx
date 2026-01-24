import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  HardDrive, 
  Trash2, 
  RefreshCw, 
  Database,
  Image,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import { useOfflineTest, type CacheTestResult } from '@/hooks/useOfflineTest';
import { toast } from 'sonner';

export default function CacheSettingsPage() {
  const navigate = useNavigate();
  const { runTest, isRunning, result, getSwStatusLabel, getSwStatusColor, toPersianNumber } = useOfflineTest();
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    // Run initial test
    runTest();
  }, [runTest]);

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      // Clear all caches
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));

      // Clear localStorage cache data (but keep settings)
      const keysToRemove = Object.keys(localStorage).filter(
        key => key.startsWith('cache_') || 
               key.startsWith('offline_') ||
               key.includes('wrestlers') ||
               key.includes('history') ||
               key.includes('buildings') ||
               key.includes('books') ||
               key.includes('albums')
      );
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Notify service worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        registration.active?.postMessage({ type: 'CLEAR_ALL_CACHES' });
      }

      toast.success('کش با موفقیت پاک شد', {
        description: 'داده‌های کش شده حذف شدند.',
      });

      // Re-run test
      await runTest();
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast.error('خطا در پاک کردن کش');
    } finally {
      setIsClearing(false);
    }
  };

  const handleRefreshCache = async () => {
    try {
      // Force update service worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.update();
      }

      toast.success('کش به‌روزرسانی شد');
      await runTest();
    } catch (error) {
      console.error('Error refreshing cache:', error);
      toast.error('خطا در به‌روزرسانی کش');
    }
  };

  const getCacheIcon = (name: string) => {
    if (name.includes('تصاویر') || name.includes('Image')) return Image;
    if (name.includes('API') || name.includes('داده')) return Database;
    if (name.includes('محلی') || name.includes('Local')) return HardDrive;
    return FileText;
  };

  const getStatusIcon = (status: CacheTestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-primary" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Header */}
      <header className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="shrink-0"
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">تنظیمات کش</h1>
          <p className="text-sm text-muted-foreground">مدیریت حافظه موقت برنامه</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Service Worker Status */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-primary" />
              وضعیت سیستم
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => runTest()}
              disabled={isRunning}
              className="gap-1"
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              بررسی مجدد
            </Button>
          </div>

          {result && (
            <div className="space-y-4">
              {/* SW Status */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-muted-foreground">Service Worker</span>
                <span className={`font-medium ${getSwStatusColor(result.serviceWorkerStatus)}`}>
                  {getSwStatusLabel(result.serviceWorkerStatus)}
                </span>
              </div>

              {/* Offline Ready Status */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-muted-foreground">آمادگی آفلاین</span>
                <span className={`font-medium flex items-center gap-1 ${
                  result.isFullyOfflineReady ? 'text-green-500' : 'text-yellow-500'
                }`}>
                  {result.isFullyOfflineReady ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      آماده
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4" />
                      نیاز به دانلود
                    </>
                  )}
                </span>
              </div>

              {/* Total Size */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-muted-foreground">حجم کل کش</span>
                <span className="font-bold text-primary">{result.totalCacheSize}</span>
              </div>

              {/* Last Test Time */}
              {result.lastTestTime && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">آخرین بررسی</span>
                  <span className="text-sm">{result.lastTestTime}</span>
                </div>
              )}
            </div>
          )}
        </GlassCard>

        {/* Cache Details */}
        <GlassCard className="p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            جزئیات کش
          </h2>

          {result?.cacheTests && (
            <div className="space-y-3">
              {result.cacheTests.map((cache, index) => {
                const Icon = getCacheIcon(cache.name);
                return (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{cache.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {toPersianNumber(cache.itemCount)} آیتم
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">{cache.size}</span>
                      {getStatusIcon(cache.status)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>

        {/* Actions */}
        <GlassCard className="p-5">
          <h2 className="text-lg font-bold mb-4">عملیات</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={handleRefreshCache}
              className="flex-1 gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              به‌روزرسانی کش
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearCache}
              disabled={isClearing}
              className="flex-1 gap-2"
            >
              {isClearing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              پاک کردن کش
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            پاک کردن کش باعث می‌شود داده‌ها مجدداً از سرور دانلود شوند
          </p>
        </GlassCard>

        {/* Tips */}
        <GlassCard className="p-5 bg-primary/5 border-primary/20">
          <h3 className="font-bold mb-2 text-primary">💡 نکات</h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>برای استفاده آفلاین، ابتدا تمام داده‌ها را دانلود کنید</li>
            <li>کش به صورت خودکار پس از ۲۴ ساعت منقضی می‌شود</li>
            <li>پاک کردن کش فقط داده‌های موقت را حذف می‌کند</li>
          </ul>
        </GlassCard>
      </div>
    </div>
  );
}
