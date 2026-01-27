import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

const LAST_SYNC_KEY = 'museum_last_background_sync';

interface BackgroundSyncState {
  syncStatus: 'idle' | 'pending' | 'syncing';
  lastSyncTime: Date | null;
  isSupported: boolean;
}

export function useBackgroundSync() {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'pending' | 'syncing'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(() => {
    const stored = localStorage.getItem(LAST_SYNC_KEY);
    return stored ? new Date(parseInt(stored)) : null;
  });

  // Check if Background Sync is supported
  const isSupported = 'serviceWorker' in navigator && 'SyncManager' in window;

  // Register Periodic Background Sync (for supported browsers)
  useEffect(() => {
    const registerPeriodicSync = async () => {
      if (!('serviceWorker' in navigator)) return;
      
      try {
        const registration = await navigator.serviceWorker.ready;
        
        // Check if periodicSync is available
        if ('periodicSync' in registration) {
          const status = await navigator.permissions.query({
            // @ts-ignore - periodicSync is not in the default PermissionName type
            name: 'periodic-background-sync',
          });
          
          if (status.state === 'granted') {
            // @ts-ignore - periodicSync is not in the default ServiceWorkerRegistration type
            await registration.periodicSync.register('museum-data-sync', {
              minInterval: 24 * 60 * 60 * 1000, // 24 hours
            });
            console.log('[BackgroundSync] Periodic sync registered');
          }
        }
      } catch (error) {
        console.log('[BackgroundSync] Periodic sync registration failed:', error);
      }
    };

    registerPeriodicSync();
  }, []);

  // Request manual background sync
  const requestSync = useCallback(async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator)) {
      console.log('[BackgroundSync] Service Worker not supported');
      return false;
    }
    
    try {
      const registration = await navigator.serviceWorker.ready;
      
      if ('sync' in registration) {
        // @ts-ignore - sync is not in the default ServiceWorkerRegistration type
        await registration.sync.register('sync-museum-data');
        setSyncStatus('pending');
        console.log('[BackgroundSync] Sync requested');
        return true;
      } else {
        // Fallback: trigger sync directly via message
        registration.active?.postMessage({ type: 'TRIGGER_SYNC' });
        setSyncStatus('syncing');
        return true;
      }
    } catch (error) {
      console.error('[BackgroundSync] Sync registration failed:', error);
      
      // Fallback: try direct sync via message
      try {
        const registration = await navigator.serviceWorker.ready;
        registration.active?.postMessage({ type: 'TRIGGER_SYNC' });
        setSyncStatus('syncing');
        return true;
      } catch (e) {
        console.error('[BackgroundSync] Fallback sync failed:', e);
        return false;
      }
    }
  }, []);

  // Listen for Service Worker messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { data } = event;
      
      if (data?.type === 'BACKGROUND_SYNC_COMPLETE') {
        setSyncStatus('idle');
        const syncTime = new Date(data.timestamp);
        setLastSyncTime(syncTime);
        localStorage.setItem(LAST_SYNC_KEY, data.timestamp.toString());
        
        toast.success('داده‌ها در پس‌زمینه به‌روز شد', {
          icon: '🔄',
          duration: 3000,
        });
      }
      
      if (data?.type === 'SYNC_STARTED') {
        setSyncStatus('syncing');
      }
      
      if (data?.type === 'SYNC_PROGRESS') {
        // Can be used to show progress if needed
        console.log('[BackgroundSync] Progress:', data.progress);
      }
      
      if (data?.type === 'SYNC_ERROR') {
        setSyncStatus('idle');
        toast.error('خطا در همگام‌سازی پس‌زمینه', {
          description: 'لطفاً دوباره تلاش کنید',
        });
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleMessage);
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, []);

  // Format last sync time for display
  const getLastSyncFormatted = useCallback((): string => {
    if (!lastSyncTime) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - lastSyncTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'همین الان';
    if (diffMins < 60) return `${diffMins} دقیقه پیش`;
    if (diffHours < 24) return `${diffHours} ساعت پیش`;
    return `${diffDays} روز پیش`;
  }, [lastSyncTime]);

  return {
    syncStatus,
    lastSyncTime,
    requestSync,
    isSupported,
    getLastSyncFormatted,
  };
}
