import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

// Interfaces
interface HistorySection {
  id: string;
  parent_id: string | null;
  title: string;
  slug: string;
  highlighted_quote: string | null;
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

interface OfflineDataContextType {
  // Data
  historySections: HistorySection[];
  buildings: Building[];
  books: Book[];
  albums: Album[];
  
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
}

const CACHE_KEYS = {
  HISTORY: 'museum_history_cache',
  BUILDINGS: 'museum_buildings_cache',
  BOOKS: 'museum_books_cache',
  ALBUMS: 'museum_albums_cache',
  TIMESTAMP: 'museum_offline_timestamp',
};

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const OfflineDataContext = createContext<OfflineDataContextType | undefined>(undefined);

export const OfflineDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // States
  const [historySections, setHistorySections] = useState<HistorySection[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  
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
      } else {
        const { data, error } = await supabase
          .from('history_sections')
          .select('*')
          .is('parent_id', null)
          .order('display_order');

        if (error) throw error;
        
        setHistorySections(data || []);
        saveToCache(CACHE_KEYS.HISTORY, data || []);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      const cached = loadFromCache<HistorySection>(CACHE_KEYS.HISTORY);
      setHistorySections(cached);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [isOffline, loadFromCache, saveToCache]);

  // Fetch Buildings
  const refreshBuildings = useCallback(async () => {
    setIsLoadingBuildings(true);
    try {
      if (isOffline) {
        const cached = loadFromCache<Building>(CACHE_KEYS.BUILDINGS);
        setBuildings(cached);
      } else {
        const { data, error } = await supabase
          .from('buildings')
          .select('id, name, description, hero_image_url, display_order')
          .order('display_order');

        if (error) throw error;
        
        setBuildings(data || []);
        saveToCache(CACHE_KEYS.BUILDINGS, data || []);
        
        // Cache building images
        const imageUrls = (data || [])
          .map(b => b.hero_image_url)
          .filter(Boolean) as string[];
        cacheImages(imageUrls);
      }
    } catch (error) {
      console.error('Error fetching buildings:', error);
      const cached = loadFromCache<Building>(CACHE_KEYS.BUILDINGS);
      setBuildings(cached);
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
      } else {
        const { data, error } = await supabase
          .from('albums')
          .select('*, album_photos(count)')
          .order('display_order');

        if (error) throw error;
        
        const albumsWithCount = (data || []).map(album => ({
          ...album,
          photo_count: (album as any).album_photos?.[0]?.count || 0,
        }));
        
        setAlbums(albumsWithCount);
        saveToCache(CACHE_KEYS.ALBUMS, albumsWithCount);
        
        // Cache album cover images
        const imageUrls = albumsWithCount
          .map(a => a.cover_image_url)
          .filter(Boolean) as string[];
        cacheImages(imageUrls);
      }
    } catch (error) {
      console.error('Error fetching albums:', error);
      const cached = loadFromCache<Album>(CACHE_KEYS.ALBUMS);
      setAlbums(cached);
    } finally {
      setIsLoadingAlbums(false);
    }
  }, [isOffline, loadFromCache, saveToCache, cacheImages]);

  // Refresh all data
  const refreshAllData = useCallback(async () => {
    await Promise.all([
      refreshHistory(),
      refreshBuildings(),
      refreshBooks(),
      refreshAlbums(),
    ]);
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

  const value: OfflineDataContextType = {
    historySections,
    buildings,
    books,
    albums,
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
  };

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
