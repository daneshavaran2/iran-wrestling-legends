import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface AutoSyncSettings {
  enabled: boolean;
  intervalHours: number;
  showNotification: boolean;
}

const STORAGE_KEY = 'auto_sync_settings';
const LAST_SYNC_KEY = 'last_auto_sync_time';

const DEFAULT_SETTINGS: AutoSyncSettings = {
  enabled: true,
  intervalHours: 24,
  showNotification: true,
};

export function useAutoSync(refreshAllData: () => Promise<void>, isOffline: boolean) {
  const [settings, setSettings] = useState<AutoSyncSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(() => {
    const stored = localStorage.getItem(LAST_SYNC_KEY);
    return stored ? new Date(stored) : null;
  });
  
  const [nextSyncTime, setNextSyncTime] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Calculate next sync time
  const calculateNextSync = useCallback(() => {
    if (!settings.enabled || !lastSyncTime) {
      setNextSyncTime(null);
      return;
    }
    const next = new Date(lastSyncTime.getTime() + settings.intervalHours * 60 * 60 * 1000);
    setNextSyncTime(next);
  }, [settings.enabled, settings.intervalHours, lastSyncTime]);

  useEffect(() => {
    calculateNextSync();
  }, [calculateNextSync]);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Perform sync
  const performSync = useCallback(async () => {
    if (isOffline || isSyncing) return;
    
    setIsSyncing(true);
    
    if (settings.showNotification) {
      toast.info('در حال به‌روزرسانی داده‌ها...', {
        icon: '🔄',
        duration: 3000,
      });
    }
    
    try {
      await refreshAllData();
      const now = new Date();
      setLastSyncTime(now);
      localStorage.setItem(LAST_SYNC_KEY, now.toISOString());
      
      if (settings.showNotification) {
        toast.success('داده‌ها با موفقیت به‌روز شد', {
          icon: '✅',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Auto sync error:', error);
      if (settings.showNotification) {
        toast.error('خطا در به‌روزرسانی داده‌ها', {
          icon: '❌',
        });
      }
    } finally {
      setIsSyncing(false);
    }
  }, [isOffline, isSyncing, settings.showNotification, refreshAllData]);

  // Check and sync automatically
  useEffect(() => {
    if (!settings.enabled || isOffline) return;

    const checkAndSync = () => {
      const lastSync = localStorage.getItem(LAST_SYNC_KEY);
      const now = Date.now();
      const interval = settings.intervalHours * 60 * 60 * 1000;
      
      if (!lastSync || (now - new Date(lastSync).getTime()) > interval) {
        performSync();
      }
    };

    // Check on mount
    checkAndSync();

    // Check every hour
    const timer = setInterval(checkAndSync, 60 * 60 * 1000);

    return () => clearInterval(timer);
  }, [settings.enabled, settings.intervalHours, isOffline, performSync]);

  const updateSettings = useCallback((newSettings: Partial<AutoSyncSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const syncNow = useCallback(async () => {
    await performSync();
  }, [performSync]);

  const getTimeUntilNextSync = useCallback((): string | null => {
    if (!nextSyncTime) return null;
    
    const now = Date.now();
    const diff = nextSyncTime.getTime() - now;
    
    if (diff <= 0) return 'به زودی';
    
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    
    if (hours > 0) {
      return `${hours} ساعت و ${minutes} دقیقه دیگر`;
    }
    return `${minutes} دقیقه دیگر`;
  }, [nextSyncTime]);

  const getLastSyncFormatted = useCallback((): string | null => {
    if (!lastSyncTime) return null;
    
    const now = Date.now();
    const diff = now - lastSyncTime.getTime();
    
    const minutes = Math.floor(diff / (60 * 1000));
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    
    if (days > 0) return `${days} روز پیش`;
    if (hours > 0) return `${hours} ساعت پیش`;
    if (minutes > 0) return `${minutes} دقیقه پیش`;
    return 'همین الان';
  }, [lastSyncTime]);

  return {
    settings,
    updateSettings,
    lastSyncTime,
    nextSyncTime,
    isSyncing,
    syncNow,
    getTimeUntilNextSync,
    getLastSyncFormatted,
  };
}
