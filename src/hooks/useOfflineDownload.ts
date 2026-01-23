import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOfflineData } from '@/contexts/OfflineDataContext';
import { useWrestlers } from '@/contexts/WrestlerContext';

export interface DownloadProgress {
  stage: 'idle' | 'wrestlers' | 'history' | 'buildings' | 'books' | 'albums' | 'images' | 'complete' | 'error';
  stageName: string;
  currentItem: number;
  totalItems: number;
  downloadedBytes: number;
  totalBytes: number;
  percentage: number;
  isDownloading: boolean;
  error?: string;
}

export interface CacheInfo {
  totalSize: number;
  totalSizeFormatted: string;
  lastUpdate: string | null;
  itemCounts: {
    wrestlers: number;
    history: number;
    buildings: number;
    books: number;
    albums: number;
    images: number;
  };
}

const CACHE_KEYS = {
  WRESTLERS: 'museum_wrestlers_cache',
  ACHIEVEMENTS: 'museum_achievements_cache',
  MEDIA: 'museum_media_cache',
  HISTORY: 'museum_history_cache',
  BUILDINGS: 'museum_buildings_cache',
  BOOKS: 'museum_books_cache',
  ALBUMS: 'museum_albums_cache',
  TIMESTAMP: 'museum_offline_timestamp',
};

const STAGE_NAMES: Record<string, string> = {
  idle: 'آماده',
  wrestlers: 'کشتی‌گیرها',
  history: 'تاریخچه',
  buildings: 'بناها',
  books: 'کتاب‌ها',
  albums: 'آلبوم‌ها',
  images: 'تصاویر',
  complete: 'تکمیل شد',
  error: 'خطا',
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '۰ بایت';
  const k = 1024;
  const sizes = ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
  // Convert to Persian numerals
  const persianValue = value.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
  return `${persianValue} ${sizes[i]}`;
}

function toPersianNumber(num: number): string {
  return num.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
}

export function useOfflineDownload() {
  const { refreshAllData } = useOfflineData();
  const { refreshWrestlers } = useWrestlers();
  const cancelRef = useRef(false);
  
  const [progress, setProgress] = useState<DownloadProgress>({
    stage: 'idle',
    stageName: STAGE_NAMES.idle,
    currentItem: 0,
    totalItems: 0,
    downloadedBytes: 0,
    totalBytes: 0,
    percentage: 0,
    isDownloading: false,
  });

  const [cacheInfo, setCacheInfo] = useState<CacheInfo>({
    totalSize: 0,
    totalSizeFormatted: '۰ بایت',
    lastUpdate: null,
    itemCounts: {
      wrestlers: 0,
      history: 0,
      buildings: 0,
      books: 0,
      albums: 0,
      images: 0,
    },
  });

  // Calculate cache info
  const updateCacheInfo = useCallback(() => {
    let totalSize = 0;
    const itemCounts = {
      wrestlers: 0,
      history: 0,
      buildings: 0,
      books: 0,
      albums: 0,
      images: 0,
    };

    // Calculate size of each cached item
    Object.entries(CACHE_KEYS).forEach(([key, cacheKey]) => {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const size = new Blob([cached]).size;
        totalSize += size;
        
        try {
          const data = JSON.parse(cached);
          if (key === 'WRESTLERS') itemCounts.wrestlers = Array.isArray(data) ? data.length : 0;
          if (key === 'HISTORY') itemCounts.history = Array.isArray(data) ? data.length : 0;
          if (key === 'BUILDINGS') itemCounts.buildings = Array.isArray(data) ? data.length : 0;
          if (key === 'BOOKS') itemCounts.books = Array.isArray(data) ? data.length : 0;
          if (key === 'ALBUMS') itemCounts.albums = Array.isArray(data) ? data.length : 0;
        } catch {
          // Ignore parse errors
        }
      }
    });

    // Get timestamp
    const timestamp = localStorage.getItem(CACHE_KEYS.TIMESTAMP);
    let lastUpdate = null;
    if (timestamp) {
      const date = new Date(parseInt(timestamp));
      lastUpdate = date.toLocaleDateString('fa-IR') + ' ' + date.toLocaleTimeString('fa-IR');
    }

    // Estimate cached images count (rough estimate based on cache API)
    if ('caches' in window) {
      caches.open('iran-wrestling-museum-v2').then(cache => {
        cache.keys().then(keys => {
          const imageKeys = keys.filter(req => 
            req.url.includes('.jpg') || 
            req.url.includes('.png') || 
            req.url.includes('.webp') ||
            req.url.includes('supabase')
          );
          setCacheInfo(prev => ({
            ...prev,
            itemCounts: { ...prev.itemCounts, images: imageKeys.length }
          }));
        });
      }).catch(() => {});
    }

    setCacheInfo({
      totalSize,
      totalSizeFormatted: formatBytes(totalSize),
      lastUpdate,
      itemCounts,
    });
  }, []);

  useEffect(() => {
    updateCacheInfo();
  }, [updateCacheInfo]);

  // Listen for service worker progress messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'DOWNLOAD_PROGRESS') {
        setProgress(prev => ({
          ...prev,
          currentItem: event.data.completed,
          totalItems: event.data.total,
          percentage: Math.round((event.data.completed / event.data.total) * 100),
        }));
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleMessage);
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, []);

  const collectAllImageUrls = async (): Promise<string[]> => {
    const imageUrls: string[] = [];

    // Wrestlers images
    const { data: wrestlers } = await supabase.from('wrestlers').select('image_url');
    wrestlers?.forEach(w => w.image_url && imageUrls.push(w.image_url));

    // Wrestler media
    const { data: wrestlerMedia } = await supabase.from('wrestler_media').select('url, thumbnail');
    wrestlerMedia?.forEach(m => {
      if (m.url) imageUrls.push(m.url);
      if (m.thumbnail) imageUrls.push(m.thumbnail);
    });

    // Buildings images
    const { data: buildings } = await supabase.from('buildings').select('hero_image_url');
    buildings?.forEach(b => b.hero_image_url && imageUrls.push(b.hero_image_url));

    const { data: buildingImages } = await supabase.from('building_images').select('url');
    buildingImages?.forEach(bi => bi.url && imageUrls.push(bi.url));

    // Books covers
    const { data: books } = await supabase.from('books').select('cover_image_url');
    books?.forEach(b => b.cover_image_url && imageUrls.push(b.cover_image_url));

    // Albums
    const { data: albums } = await supabase.from('albums').select('cover_image_url');
    albums?.forEach(a => a.cover_image_url && imageUrls.push(a.cover_image_url));

    const { data: albumPhotos } = await supabase.from('album_photos').select('url');
    albumPhotos?.forEach(p => p.url && imageUrls.push(p.url));

    // History media
    const { data: historyMedia } = await supabase.from('history_media').select('url');
    historyMedia?.forEach(m => m.url && imageUrls.push(m.url));

    // About media
    const { data: aboutMedia } = await supabase.from('about_media').select('url');
    aboutMedia?.forEach(m => m.url && imageUrls.push(m.url));

    return imageUrls.filter(Boolean);
  };

  const downloadImagesWithProgress = async (urls: string[]): Promise<void> => {
    const batchSize = 5;
    let completed = 0;
    const total = urls.length;
    let downloadedBytes = 0;

    for (let i = 0; i < urls.length; i += batchSize) {
      if (cancelRef.current) break;

      const batch = urls.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (url) => {
          try {
            const response = await fetch(url);
            if (response.ok) {
              const blob = await response.blob();
              downloadedBytes += blob.size;
              
              // Cache the image
              if ('caches' in window) {
                const cache = await caches.open('iran-wrestling-museum-v2');
                await cache.put(url, new Response(blob));
              }
            }
            completed++;
            
            setProgress(prev => ({
              ...prev,
              currentItem: completed,
              totalItems: total,
              downloadedBytes,
              percentage: Math.round((completed / total) * 100),
            }));
          } catch {
            completed++;
          }
        })
      );
    }
  };

  const startFullDownload = useCallback(async () => {
    cancelRef.current = false;
    
    setProgress({
      stage: 'wrestlers',
      stageName: STAGE_NAMES.wrestlers,
      currentItem: 0,
      totalItems: 1,
      downloadedBytes: 0,
      totalBytes: 0,
      percentage: 0,
      isDownloading: true,
    });

    try {
      // Stage 1: Wrestlers
      await refreshWrestlers();
      if (cancelRef.current) return;
      
      setProgress(prev => ({
        ...prev,
        stage: 'history',
        stageName: STAGE_NAMES.history,
        percentage: 15,
      }));

      // Stage 2-5: Other data (handled by refreshAllData)
      await refreshAllData();
      if (cancelRef.current) return;

      setProgress(prev => ({
        ...prev,
        stage: 'images',
        stageName: STAGE_NAMES.images,
        percentage: 30,
        currentItem: 0,
      }));

      // Stage 6: Download all images
      const imageUrls = await collectAllImageUrls();
      if (cancelRef.current) return;
      
      setProgress(prev => ({
        ...prev,
        totalItems: imageUrls.length,
      }));

      await downloadImagesWithProgress(imageUrls);
      if (cancelRef.current) return;

      // Complete
      localStorage.setItem(CACHE_KEYS.TIMESTAMP, Date.now().toString());
      
      setProgress({
        stage: 'complete',
        stageName: STAGE_NAMES.complete,
        currentItem: 0,
        totalItems: 0,
        downloadedBytes: 0,
        totalBytes: 0,
        percentage: 100,
        isDownloading: false,
      });

      updateCacheInfo();
    } catch (error) {
      setProgress(prev => ({
        ...prev,
        stage: 'error',
        stageName: STAGE_NAMES.error,
        isDownloading: false,
        error: error instanceof Error ? error.message : 'خطای ناشناخته',
      }));
    }
  }, [refreshWrestlers, refreshAllData, updateCacheInfo]);

  const cancelDownload = useCallback(() => {
    cancelRef.current = true;
    setProgress(prev => ({
      ...prev,
      stage: 'idle',
      stageName: STAGE_NAMES.idle,
      isDownloading: false,
    }));
  }, []);

  const clearAllCache = useCallback(async () => {
    // Clear localStorage
    Object.values(CACHE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });

    // Clear Cache API
    if ('caches' in window) {
      try {
        await caches.delete('iran-wrestling-museum-v2');
        await caches.delete('iran-wrestling-api-v1');
      } catch {
        // Ignore errors
      }
    }

    updateCacheInfo();
    
    setProgress({
      stage: 'idle',
      stageName: STAGE_NAMES.idle,
      currentItem: 0,
      totalItems: 0,
      downloadedBytes: 0,
      totalBytes: 0,
      percentage: 0,
      isDownloading: false,
    });
  }, [updateCacheInfo]);

  return {
    progress,
    cacheInfo,
    startFullDownload,
    cancelDownload,
    clearAllCache,
    updateCacheInfo,
    formatBytes,
    toPersianNumber,
  };
}
