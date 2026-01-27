import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { iranianProvinces, wrestlingStyles, medalTypes } from '@/data/wrestlers';

// Cache keys for localStorage
const CACHE_KEYS = {
  WRESTLERS: 'museum_wrestlers_cache',
  ACHIEVEMENTS: 'museum_achievements_cache',
  MEDIA: 'museum_media_cache',
  TIMESTAMP: 'museum_cache_timestamp',
};

// Cache expiry time (24 hours in milliseconds)
const CACHE_EXPIRY = 24 * 60 * 60 * 1000;

export interface Wrestler {
  id: string;
  name: string;
  style: 'freestyle' | 'greco-roman';
  weight_class: string | null;
  province: string | null;
  image_url: string | null;
  bio: string | null;
  full_story: string | null;
  intro_video_url: string | null;
  success_path: string | null;
  social_activities: string | null;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  wrestler_id: string;
  title: string;
  event: string;
  year: number;
  medal_type: 'gold' | 'silver' | 'bronze';
  description: string | null;
}

export interface WrestlerMedia {
  id: string;
  wrestler_id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail: string | null;
  title: string | null;
  display_order: number;
}

interface WrestlerContextType {
  wrestlers: Wrestler[];
  achievements: Achievement[];
  media: WrestlerMedia[];
  isLoading: boolean;
  error: string | null;
  isOffline: boolean;
  refreshWrestlers: () => Promise<void>;
  getWrestlerById: (id: string) => Wrestler | undefined;
  getAchievementsByWrestlerId: (id: string) => Achievement[];
  getMediaByWrestlerId: (id: string) => WrestlerMedia[];
  getVisibleWrestlers: () => Wrestler[];
  addWrestler: (wrestler: Omit<Wrestler, 'id' | 'created_at' | 'updated_at' | 'is_visible'>) => Promise<Wrestler>;
  updateWrestler: (id: string, updates: Partial<Wrestler>) => Promise<Wrestler>;
  toggleWrestlerVisibility: (id: string) => Promise<void>;
  deleteWrestler: (id: string) => Promise<void>;
  addAchievement: (achievement: Omit<Achievement, 'id'>) => Promise<Achievement>;
  updateAchievement: (id: string, updates: Partial<Achievement>) => Promise<Achievement>;
  deleteAchievement: (id: string) => Promise<void>;
  addMedia: (media: Omit<WrestlerMedia, 'id'>) => Promise<WrestlerMedia>;
  deleteMedia: (id: string) => Promise<void>;
}

const WrestlerContext = createContext<WrestlerContextType | undefined>(undefined);

// Helper functions for cache management
function saveToCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    localStorage.setItem(CACHE_KEYS.TIMESTAMP, Date.now().toString());
  } catch (err) {
    console.warn('Failed to save to cache:', err);
  }
}

function loadFromCache<T>(key: string): T | null {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const timestamp = localStorage.getItem(CACHE_KEYS.TIMESTAMP);
    if (timestamp) {
      const age = Date.now() - parseInt(timestamp, 10);
      if (age > CACHE_EXPIRY) {
        // Cache expired, but still return data for offline use
        console.log('Cache expired but using for offline fallback');
      }
    }
    
    return JSON.parse(cached) as T;
  } catch (err) {
    console.warn('Failed to load from cache:', err);
    return null;
  }
}

function clearCache(): void {
  try {
    Object.values(CACHE_KEYS).forEach(key => localStorage.removeItem(key));
  } catch (err) {
    console.warn('Failed to clear cache:', err);
  }
}

export function WrestlerProvider({ children }: { children: ReactNode }) {
  const [wrestlers, setWrestlers] = useState<Wrestler[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [media, setMedia] = useState<WrestlerMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  // Load cached data on initial mount
  useEffect(() => {
    const cachedWrestlers = loadFromCache<Wrestler[]>(CACHE_KEYS.WRESTLERS);
    const cachedAchievements = loadFromCache<Achievement[]>(CACHE_KEYS.ACHIEVEMENTS);
    const cachedMedia = loadFromCache<WrestlerMedia[]>(CACHE_KEYS.MEDIA);
    
    if (cachedWrestlers && cachedWrestlers.length > 0) {
      setWrestlers(cachedWrestlers);
      console.log('Loaded wrestlers from cache:', cachedWrestlers.length);
    }
    if (cachedAchievements) {
      setAchievements(cachedAchievements);
    }
    if (cachedMedia) {
      setMedia(cachedMedia);
    }
  }, []);

  const fetchWrestlers = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('wrestlers')
        .select('*')
        .order('name');

      if (error) throw error;
      
      // Map the data to match our interface
      const mappedData = (data || []).map(w => ({
        ...w,
        style: w.style as 'freestyle' | 'greco-roman',
        is_visible: w.is_visible ?? true,
      }));
      
      setWrestlers(mappedData);
      saveToCache(CACHE_KEYS.WRESTLERS, mappedData);
      return true;
    } catch (err) {
      console.error('Error fetching wrestlers:', err);
      return false;
    }
  };

  const fetchAchievements = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('year', { ascending: false });

      if (error) throw error;
      
      const mappedData = (data || []).map(a => ({
        ...a,
        medal_type: a.medal_type as 'gold' | 'silver' | 'bronze',
      }));
      
      setAchievements(mappedData);
      saveToCache(CACHE_KEYS.ACHIEVEMENTS, mappedData);
      return true;
    } catch (err) {
      console.error('Error fetching achievements:', err);
      return false;
    }
  };

  const fetchMedia = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('wrestler_media')
        .select('*')
        .order('display_order');

      if (error) throw error;
      
      const mappedData = (data || []).map(m => ({
        ...m,
        type: m.type as 'image' | 'video',
      }));
      
      setMedia(mappedData);
      saveToCache(CACHE_KEYS.MEDIA, mappedData);
      return true;
    } catch (err) {
      console.error('Error fetching media:', err);
      return false;
    }
  };

  const refreshWrestlers = async () => {
    setIsLoading(true);
    setError(null);
    
    const results = await Promise.all([
      fetchWrestlers(),
      fetchAchievements(),
      fetchMedia()
    ]);
    
    const allSucceeded = results.every(r => r === true);
    
    if (!allSucceeded) {
      // Check if we have cached data
      const hasCachedData = wrestlers.length > 0;
      
      if (hasCachedData) {
        setIsOffline(true);
        setError('حالت آفلاین - نمایش داده‌های ذخیره شده');
      } else {
        setError('خطا در بارگذاری اطلاعات. لطفاً اتصال اینترنت را بررسی کنید.');
      }
    } else {
      setIsOffline(false);
      
      // Pre-cache wrestler images for offline use
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const imageUrls = wrestlers
          .filter(w => w.image_url)
          .map(w => w.image_url as string);
        
        navigator.serviceWorker.controller.postMessage({
          type: 'CACHE_IMAGES',
          urls: imageUrls,
        });
      }
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    refreshWrestlers();
    
    // Listen for online/offline events
    const handleOnline = () => {
      console.log('Back online, refreshing data...');
      setIsOffline(false);
      refreshWrestlers();
    };
    
    const handleOffline = () => {
      console.log('Gone offline, using cached data');
      setIsOffline(true);
      if (wrestlers.length > 0) {
        setError('حالت آفلاین - نمایش داده‌های ذخیره شده');
      }
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getWrestlerById = useCallback((id: string) => 
    wrestlers.find(w => w.id === id), [wrestlers]);
  
  const getVisibleWrestlers = useCallback(() => 
    wrestlers.filter(w => w.is_visible), [wrestlers]);
  
  const getAchievementsByWrestlerId = useCallback((id: string) => 
    achievements.filter(a => a.wrestler_id === id), [achievements]);
  
  const getMediaByWrestlerId = useCallback((id: string) => 
    media.filter(m => m.wrestler_id === id).sort((a, b) => a.display_order - b.display_order), [media]);

  const addWrestler = async (wrestler: Omit<Wrestler, 'id' | 'created_at' | 'updated_at' | 'is_visible'>): Promise<Wrestler> => {
    const { data, error } = await supabase
      .from('wrestlers')
      .insert({
        name: wrestler.name,
        style: wrestler.style,
        weight_class: wrestler.weight_class,
        province: wrestler.province,
        bio: wrestler.bio,
        full_story: wrestler.full_story,
        image_url: wrestler.image_url,
        intro_video_url: wrestler.intro_video_url,
        success_path: wrestler.success_path,
        social_activities: wrestler.social_activities,
        is_visible: true,
      })
      .select()
      .single();

    if (error) throw error;
    
    const newWrestler = {
      ...data,
      style: data.style as 'freestyle' | 'greco-roman',
      is_visible: data.is_visible ?? true,
    };
    
    const updatedWrestlers = [...wrestlers, newWrestler];
    setWrestlers(updatedWrestlers);
    saveToCache(CACHE_KEYS.WRESTLERS, updatedWrestlers);
    return newWrestler;
  };

  const updateWrestler = async (id: string, updates: Partial<Wrestler>): Promise<Wrestler> => {
    const updateData: Record<string, unknown> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.style !== undefined) updateData.style = updates.style;
    if (updates.weight_class !== undefined) updateData.weight_class = updates.weight_class;
    if (updates.province !== undefined) updateData.province = updates.province;
    if (updates.bio !== undefined) updateData.bio = updates.bio;
    if (updates.full_story !== undefined) updateData.full_story = updates.full_story;
    if (updates.image_url !== undefined) updateData.image_url = updates.image_url;
    if (updates.intro_video_url !== undefined) updateData.intro_video_url = updates.intro_video_url;
    if (updates.success_path !== undefined) updateData.success_path = updates.success_path;
    if (updates.social_activities !== undefined) updateData.social_activities = updates.social_activities;
    if (updates.is_visible !== undefined) updateData.is_visible = updates.is_visible;

    const { data, error } = await supabase
      .from('wrestlers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    const updated = {
      ...data,
      style: data.style as 'freestyle' | 'greco-roman',
      is_visible: data.is_visible ?? true,
    };
    
    const updatedWrestlers = wrestlers.map(w => w.id === id ? updated : w);
    setWrestlers(updatedWrestlers);
    saveToCache(CACHE_KEYS.WRESTLERS, updatedWrestlers);
    return updated;
  };

  const toggleWrestlerVisibility = async (id: string): Promise<void> => {
    const wrestler = wrestlers.find(w => w.id === id);
    if (!wrestler) return;

    await updateWrestler(id, { is_visible: !wrestler.is_visible });
  };

  const deleteWrestler = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('wrestlers')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    const updatedWrestlers = wrestlers.filter(w => w.id !== id);
    const updatedAchievements = achievements.filter(a => a.wrestler_id !== id);
    const updatedMedia = media.filter(m => m.wrestler_id !== id);
    
    setWrestlers(updatedWrestlers);
    setAchievements(updatedAchievements);
    setMedia(updatedMedia);
    
    saveToCache(CACHE_KEYS.WRESTLERS, updatedWrestlers);
    saveToCache(CACHE_KEYS.ACHIEVEMENTS, updatedAchievements);
    saveToCache(CACHE_KEYS.MEDIA, updatedMedia);
  };

  const addAchievement = async (achievement: Omit<Achievement, 'id'>): Promise<Achievement> => {
    const { data, error } = await supabase
      .from('achievements')
      .insert({
        wrestler_id: achievement.wrestler_id,
        title: achievement.title,
        event: achievement.event,
        year: achievement.year,
        medal_type: achievement.medal_type,
        description: achievement.description,
      })
      .select()
      .single();

    if (error) throw error;
    
    const newAchievement = {
      ...data,
      medal_type: data.medal_type as 'gold' | 'silver' | 'bronze',
    };
    
    const updatedAchievements = [...achievements, newAchievement];
    setAchievements(updatedAchievements);
    saveToCache(CACHE_KEYS.ACHIEVEMENTS, updatedAchievements);
    return newAchievement;
  };

  const updateAchievement = async (id: string, updates: Partial<Achievement>): Promise<Achievement> => {
    const { data, error } = await supabase
      .from('achievements')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    const updated = {
      ...data,
      medal_type: data.medal_type as 'gold' | 'silver' | 'bronze',
    };
    
    const updatedAchievements = achievements.map(a => a.id === id ? updated : a);
    setAchievements(updatedAchievements);
    saveToCache(CACHE_KEYS.ACHIEVEMENTS, updatedAchievements);
    return updated;
  };

  const deleteAchievement = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('achievements')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    const updatedAchievements = achievements.filter(a => a.id !== id);
    setAchievements(updatedAchievements);
    saveToCache(CACHE_KEYS.ACHIEVEMENTS, updatedAchievements);
  };

  const addMedia = async (mediaItem: Omit<WrestlerMedia, 'id'>): Promise<WrestlerMedia> => {
    const { data, error } = await supabase
      .from('wrestler_media')
      .insert({
        wrestler_id: mediaItem.wrestler_id,
        type: mediaItem.type,
        url: mediaItem.url,
        thumbnail: mediaItem.thumbnail,
        title: mediaItem.title,
        display_order: mediaItem.display_order,
      })
      .select()
      .single();

    if (error) throw error;
    
    const newMedia = {
      ...data,
      type: data.type as 'image' | 'video',
    };
    
    const updatedMedia = [...media, newMedia];
    setMedia(updatedMedia);
    saveToCache(CACHE_KEYS.MEDIA, updatedMedia);
    return newMedia;
  };

  const deleteMedia = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('wrestler_media')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    const updatedMedia = media.filter(m => m.id !== id);
    setMedia(updatedMedia);
    saveToCache(CACHE_KEYS.MEDIA, updatedMedia);
  };

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    wrestlers,
    achievements,
    media,
    isLoading,
    error,
    isOffline,
    refreshWrestlers,
    getWrestlerById,
    getVisibleWrestlers,
    getAchievementsByWrestlerId,
    getMediaByWrestlerId,
    addWrestler,
    updateWrestler,
    deleteWrestler,
    toggleWrestlerVisibility,
    addAchievement,
    updateAchievement,
    deleteAchievement,
    addMedia,
    deleteMedia,
  }), [
    wrestlers, achievements, media, isLoading, error, isOffline,
    refreshWrestlers, getWrestlerById, getVisibleWrestlers,
    getAchievementsByWrestlerId, getMediaByWrestlerId
  ]);

  return (
    <WrestlerContext.Provider value={contextValue}>
      {children}
    </WrestlerContext.Provider>
  );
}

export function useWrestlers() {
  const context = useContext(WrestlerContext);
  if (context === undefined) {
    throw new Error('useWrestlers must be used within a WrestlerProvider');
  }
  return context;
}
