import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAutoSync } from '@/hooks/useAutoSync';

// Interfaces
interface HistorySection {
  id: string;
  parent_id: string | null;
  title: string;
  slug: string;
  highlighted_quote: string | null;
  content: string | null;
  display_order: number;
}

interface Building {
  id: string;
  name: string;
  description: string | null;
  hero_image_url: string | null;
  display_order: number;
}

interface Book {
  id: string;
  title: string;
  author: string;
  cover_image_url: string | null;
  summary: string | null;
  related_wrestler_id: string | null;
  display_order: number;
}

interface Album {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  display_order: number;
  photo_count?: number;
}

interface HistoryMedia {
  id: string;
  section_id: string;
  type: string;
  url: string;
  title: string | null;
  display_order: number;
}

interface BuildingImage {
  id: string;
  building_id: string;
  url: string;
  title: string | null;
  display_order: number;
}

interface AlbumPhoto {
  id: string;
  album_id: string;
  url: string;
  caption: string | null;
  display_order: number;
}

interface AutoSyncSettings {
  enabled: boolean;
  intervalHours: number;
  showNotification: boolean;
}

interface OfflineDataContextType {
  // Data
  historySections: HistorySection[];
  allHistorySections: HistorySection[];
  historyMedia: HistoryMedia[];
  buildings: Building[];
  buildingImages: BuildingImage[];
  books: Book[];
  albums: Album[];
  albumPhotos: AlbumPhoto[];
  
  // Loading states
  isLoadingHistory: boolean;
  isLoadingBuildings: boolean;
  isLoadingBooks: boolean;
  isLoadingAlbums: boolean;
  
  // Status
  isOffline: boolean;
  lastSyncTime: Date | null;
  
  // Actions
  refreshAllData: () => Promise<void>;
  refreshHistory: () => Promise<void>;
  refreshBuildings: () => Promise<void>;
  refreshBooks: () => Promise<void>;
  refreshAlbums: () => Promise<void>;

  // Deep getters (offline-safe)
  getHistoryBySlug: (slug: string) => HistorySection | undefined;
  getHistoryChildren: (parentId: string) => HistorySection[];
  getHistoryMediaFor: (sectionId: string) => HistoryMedia[];
  getBuildingById: (id: string) => Building | undefined;
  getBuildingImagesFor: (buildingId: string) => BuildingImage[];
  getAlbumById: (id: string) => Album | undefined;
  getAlbumPhotosFor: (albumId: string) => AlbumPhoto[];
  
  // Auto Sync
  autoSyncSettings: AutoSyncSettings;
  updateAutoSyncSettings: (settings: Partial<AutoSyncSettings>) => void;
  isSyncing: boolean;
  syncNow: () => Promise<void>;
  getTimeUntilNextSync: () => string | null;
  getLastSyncFormatted: () => string | null;
}

const CACHE_KEYS = {
  HISTORY: 'museum_history_cache',
  HISTORY_ALL: 'museum_history_all_cache',
  HISTORY_MEDIA: 'museum_history_media_cache',
  BUILDINGS: 'museum_buildings_cache',
  BUILDING_IMAGES: 'museum_building_images_cache',
  BOOKS: 'museum_books_cache',
  ALBUMS: 'museum_albums_cache',
  ALBUM_PHOTOS: 'museum_album_photos_cache',
  TIMESTAMP: 'museum_offline_timestamp',
};

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const OfflineDataContext = createContext<OfflineDataContextType | undefined>(undefined);

export const OfflineDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // States
  const [historySections, setHistorySections] = useState<HistorySection[]>([]);
  const [allHistorySections, setAllHistorySections] = useState<HistorySection[]>([]);
  const [historyMedia, setHistoryMedia] = useState<HistoryMedia[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [buildingImages, setBuildingImages] = useState<BuildingImage[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [albumPhotos, setAlbumPhotos] = useState<AlbumPhoto[]>([]);
  
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(true);
  const [isLoadingBooks, setIsLoadingBooks] = useState(true);
  const [isLoadingAlbums, setIsLoadingAlbums] = useState(true);
  
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load from cache
  const loadFromCache = useCallback(<T,>(key: string): T[] => {
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          return data;
        }
      }
    } catch (error) {
      console.error(`Error loading cache for ${key}:`, error);
    }
    return [];
  }, []);

  // Save to cache
  const saveToCache = useCallback(<T,>(key: string, data: T[]) => {
    try {
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error(`Error saving cache for ${key}:`, error);
    }
  }, []);

  // Cache images in Service Worker
  const cacheImages = useCallback((urls: string[]) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_IMAGES',
        urls: urls.filter(Boolean),
      });
    }
  }, []);

  // Fetch History
  const refreshHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      if (isOffline) {
        const cached = loadFromCache<HistorySection>(CACHE_KEYS.HISTORY);
        setHistorySections(cached);
        setAllHistorySections(loadFromCache<HistorySection>(CACHE_KEYS.HISTORY_ALL));
        setHistoryMedia(loadFromCache<HistoryMedia>(CACHE_KEYS.HISTORY_MEDIA));
      } else {
        // Pull ALL history sections (root + children) and all media in parallel
        const [allRes, mediaRes] = await Promise.all([
          supabase.from('history_sections').select('*').order('display_order'),
          supabase.from('history_media').select('*').order('display_order'),
        ]);

        if (allRes.error) throw allRes.error;

        const all = (allRes.data || []) as HistorySection[];
        const roots = all.filter(s => s.parent_id === null);

        setAllHistorySections(all);
        setHistorySections(roots);
        saveToCache(CACHE_KEYS.HISTORY, roots);
        saveToCache(CACHE_KEYS.HISTORY_ALL, all);

        const mediaList = (mediaRes.data || []) as HistoryMedia[];
        setHistoryMedia(mediaList);
        saveToCache(CACHE_KEYS.HISTORY_MEDIA, mediaList);

        // Pre-cache history media images
        cacheImages(mediaList.filter(m => m.type === 'image').map(m => m.url));
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      const cached = loadFromCache<HistorySection>(CACHE_KEYS.HISTORY);
      setHistorySections(cached);
      setAllHistorySections(loadFromCache<HistorySection>(CACHE_KEYS.HISTORY_ALL));
      setHistoryMedia(loadFromCache<HistoryMedia>(CACHE_KEYS.HISTORY_MEDIA));
    } finally {
      setIsLoadingHistory(false);
    }
  }, [isOffline, loadFromCache, saveToCache, cacheImages]);

  // Fetch Buildings
  const refreshBuildings = useCallback(async () => {
    setIsLoadingBuildings(true);
    try {
      if (isOffline) {
        const cached = loadFromCache<Building>(CACHE_KEYS.BUILDINGS);
        setBuildings(cached);
        setBuildingImages(loadFromCache<BuildingImage>(CACHE_KEYS.BUILDING_IMAGES));
      } else {
        const [buildingsRes, imagesRes] = await Promise.all([
          supabase.from('buildings').select('id, name, description, hero_image_url, display_order').order('display_order'),
          supabase.from('building_images').select('*').order('display_order'),
        ]);

        if (buildingsRes.error) throw buildingsRes.error;

        const list = (buildingsRes.data || []) as Building[];
        setBuildings(list);
        saveToCache(CACHE_KEYS.BUILDINGS, list);

        const images = (imagesRes.data || []) as BuildingImage[];
        setBuildingImages(images);
        saveToCache(CACHE_KEYS.BUILDING_IMAGES, images);

        // Cache hero + gallery images
        const heroUrls = list.map(b => b.hero_image_url).filter(Boolean) as string[];
        const galleryUrls = images.map(i => i.url).filter(Boolean);
        cacheImages([...heroUrls, ...galleryUrls]);
      }
    } catch (error) {
      console.error('Error fetching buildings:', error);
      const cached = loadFromCache<Building>(CACHE_KEYS.BUILDINGS);
      setBuildings(cached);
      setBuildingImages(loadFromCache<BuildingImage>(CACHE_KEYS.BUILDING_IMAGES));
    } finally {
      setIsLoadingBuildings(false);
    }
  }, [isOffline, loadFromCache, saveToCache, cacheImages]);

  // Fetch Books
  const refreshBooks = useCallback(async () => {
    setIsLoadingBooks(true);
    try {
      if (isOffline) {
        const cached = loadFromCache<Book>(CACHE_KEYS.BOOKS);
        setBooks(cached);
      } else {
        const { data, error } = await supabase
          .from('books')
          .select('*')
          .order('display_order');

        if (error) throw error;
        
        setBooks(data || []);
        saveToCache(CACHE_KEYS.BOOKS, data || []);
        
        // Cache book cover images
        const imageUrls = (data || [])
          .map(b => b.cover_image_url)
          .filter(Boolean) as string[];
        cacheImages(imageUrls);
      }
    } catch (error) {
      console.error('Error fetching books:', error);
      const cached = loadFromCache<Book>(CACHE_KEYS.BOOKS);
      setBooks(cached);
    } finally {
      setIsLoadingBooks(false);
    }
  }, [isOffline, loadFromCache, saveToCache, cacheImages]);

  // Fetch Albums
  const refreshAlbums = useCallback(async () => {
    setIsLoadingAlbums(true);
    try {
      if (isOffline) {
        const cached = loadFromCache<Album>(CACHE_KEYS.ALBUMS);
        setAlbums(cached);
        setAlbumPhotos(loadFromCache<AlbumPhoto>(CACHE_KEYS.ALBUM_PHOTOS));
      } else {
        const [albumsRes, photosRes] = await Promise.all([
          supabase.from('albums').select('*, album_photos(count)').order('display_order'),
          supabase.from('album_photos').select('*').order('display_order'),
        ]);

        if (albumsRes.error) throw albumsRes.error;

        const albumsWithCount = (albumsRes.data || []).map((album: any) => ({
          ...album,
          photo_count: album.album_photos?.[0]?.count || 0,
        }));

        setAlbums(albumsWithCount);
        saveToCache(CACHE_KEYS.ALBUMS, albumsWithCount);

        const photos = (photosRes.data || []) as AlbumPhoto[];
        setAlbumPhotos(photos);
        saveToCache(CACHE_KEYS.ALBUM_PHOTOS, photos);

        // Cache album covers + all photos
        const coverUrls = albumsWithCount.map(a => a.cover_image_url).filter(Boolean) as string[];
        const photoUrls = photos.map(p => p.url).filter(Boolean);
        cacheImages([...coverUrls, ...photoUrls]);
      }
    } catch (error) {
      console.error('Error fetching albums:', error);
      const cached = loadFromCache<Album>(CACHE_KEYS.ALBUMS);
      setAlbums(cached);
      setAlbumPhotos(loadFromCache<AlbumPhoto>(CACHE_KEYS.ALBUM_PHOTOS));
    } finally {
      setIsLoadingAlbums(false);
    }
  }, [isOffline, loadFromCache, saveToCache, cacheImages]);

  // Refresh all data with concurrent fetching and timeout
  const refreshAllData = useCallback(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout
    
    try {
      // Use Promise.allSettled for resilient parallel fetching
      await Promise.allSettled([
        refreshHistory(),
        refreshBuildings(),
        refreshBooks(),
        refreshAlbums(),
      ]);
    } finally {
      clearTimeout(timeout);
    }
    
    setLastSyncTime(new Date());
    localStorage.setItem(CACHE_KEYS.TIMESTAMP, new Date().toISOString());
  }, [refreshHistory, refreshBuildings, refreshBooks, refreshAlbums]);

  // Initial load
  useEffect(() => {
    // Load cached timestamp
    const savedTimestamp = localStorage.getItem(CACHE_KEYS.TIMESTAMP);
    if (savedTimestamp) {
      setLastSyncTime(new Date(savedTimestamp));
    }
    
    refreshAllData();
  }, []);

  // Refresh when coming online
  useEffect(() => {
    if (!isOffline) {
      refreshAllData();
    }
  }, [isOffline, refreshAllData]);

  // Auto Sync hook
  const {
    settings: autoSyncSettings,
    updateSettings: updateAutoSyncSettings,
    isSyncing,
    syncNow,
    getTimeUntilNextSync,
    getLastSyncFormatted,
  } = useAutoSync(refreshAllData, isOffline);

  // Deep getters
  const getHistoryBySlug = useCallback(
    (slug: string) => allHistorySections.find(s => s.slug === slug),
    [allHistorySections]
  );
  const getHistoryChildren = useCallback(
    (parentId: string) =>
      allHistorySections
        .filter(s => s.parent_id === parentId)
        .sort((a, b) => a.display_order - b.display_order),
    [allHistorySections]
  );
  const getHistoryMediaFor = useCallback(
    (sectionId: string) =>
      historyMedia
        .filter(m => m.section_id === sectionId)
        .sort((a, b) => a.display_order - b.display_order),
    [historyMedia]
  );
  const getBuildingById = useCallback(
    (id: string) => buildings.find(b => b.id === id),
    [buildings]
  );
  const getBuildingImagesFor = useCallback(
    (buildingId: string) =>
      buildingImages
        .filter(i => i.building_id === buildingId)
        .sort((a, b) => a.display_order - b.display_order),
    [buildingImages]
  );
  const getAlbumById = useCallback(
    (id: string) => albums.find(a => a.id === id),
    [albums]
  );
  const getAlbumPhotosFor = useCallback(
    (albumId: string) =>
      albumPhotos
        .filter(p => p.album_id === albumId)
        .sort((a, b) => a.display_order - b.display_order),
    [albumPhotos]
  );

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo<OfflineDataContextType>(() => ({
    historySections,
    allHistorySections,
    historyMedia,
    buildings,
    buildingImages,
    books,
    albums,
    albumPhotos,
    isLoadingHistory,
    isLoadingBuildings,
    isLoadingBooks,
    isLoadingAlbums,
    isOffline,
    lastSyncTime,
    refreshAllData,
    refreshHistory,
    refreshBuildings,
    refreshBooks,
    refreshAlbums,
    getHistoryBySlug,
    getHistoryChildren,
    getHistoryMediaFor,
    getBuildingById,
    getBuildingImagesFor,
    getAlbumById,
    getAlbumPhotosFor,
    // Auto Sync
    autoSyncSettings,
    updateAutoSyncSettings,
    isSyncing,
    syncNow,
    getTimeUntilNextSync,
    getLastSyncFormatted,
  }), [
    historySections, allHistorySections, historyMedia,
    buildings, buildingImages, books, albums, albumPhotos,
    isLoadingHistory, isLoadingBuildings, isLoadingBooks, isLoadingAlbums,
    isOffline, lastSyncTime, refreshAllData, refreshHistory, refreshBuildings,
    refreshBooks, refreshAlbums, autoSyncSettings, updateAutoSyncSettings,
    isSyncing, syncNow, getTimeUntilNextSync, getLastSyncFormatted,
    getHistoryBySlug, getHistoryChildren, getHistoryMediaFor,
    getBuildingById, getBuildingImagesFor, getAlbumById, getAlbumPhotosFor,
  ]);

  return (
    <OfflineDataContext.Provider value={value}>
      {children}
    </OfflineDataContext.Provider>
  );
};

export const useOfflineData = (): OfflineDataContextType => {
  const context = useContext(OfflineDataContext);
  if (context === undefined) {
    throw new Error('useOfflineData must be used within an OfflineDataProvider');
  }
  return context;
};
