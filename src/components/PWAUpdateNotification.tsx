import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function PWAUpdateNotification() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showReload, setShowReload] = useState(false);

  const reloadPage = useCallback(() => {
    waitingWorker?.postMessage({ type: 'SKIP_WAITING' });
    setShowReload(false);
    window.location.reload();
  }, [waitingWorker]);

  useEffect(() => {
    // Register service worker and listen for updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        // Check for updates periodically (every hour)
        const checkInterval = setInterval(() => {
          registration.update().catch(console.error);
        }, 60 * 60 * 1000);

        // Listen for new service worker waiting
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New update available
                setWaitingWorker(newWorker);
                setShowReload(true);
              }
            });
          }
        });

        // Check if there's already a waiting worker
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setShowReload(true);
        }

        return () => clearInterval(checkInterval);
      });

      // Listen for controller change
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SW_UPDATED') {
          toast.success('برنامه به‌روزرسانی شد!', {
            description: 'آخرین تغییرات اعمال شد.',
            duration: 3000,
          });
        }
      });
    }
  }, []);

  useEffect(() => {
    if (showReload) {
      toast.custom(
        (t) => (
          <div className="cyber-glass rounded-xl p-4 flex items-center gap-3 shadow-lg border border-primary/20">
            <div className="p-2 rounded-lg bg-primary/20">
              <Download className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-foreground">نسخه جدید موجود است</p>
              <p className="text-xs text-muted-foreground">
                برای دریافت آخرین تغییرات به‌روزرسانی کنید
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  reloadPage();
                  toast.dismiss(t);
                }}
                className="gap-1"
              >
                <RefreshCw className="h-4 w-4" />
                به‌روزرسانی
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowReload(false);
                  toast.dismiss(t);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ),
        {
          duration: Infinity,
          id: 'pwa-update',
          position: 'bottom-center',
        }
      );
    }
  }, [showReload, reloadPage]);

  return null;
}
