import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Wrestler, getMockWrestlers, Achievement, WrestlerMedia } from '@/data/wrestlers';

interface WrestlerContextType {
  wrestlers: Wrestler[];
  achievements: Achievement[];
  media: WrestlerMedia[];
  isLoading: boolean;
  error: string | null;
  getWrestlerById: (id: string) => Wrestler | undefined;
  getAchievementsByWrestlerId: (id: string) => Achievement[];
  getMediaByWrestlerId: (id: string) => WrestlerMedia[];
  addWrestler: (wrestler: Omit<Wrestler, 'id' | 'created_at' | 'updated_at'>) => Promise<Wrestler>;
  updateWrestler: (id: string, updates: Partial<Wrestler>) => Promise<Wrestler>;
  deleteWrestler: (id: string) => Promise<void>;
  addAchievement: (achievement: Omit<Achievement, 'id'>) => Promise<Achievement>;
  updateAchievement: (id: string, updates: Partial<Achievement>) => Promise<Achievement>;
  deleteAchievement: (id: string) => Promise<void>;
  addMedia: (media: Omit<WrestlerMedia, 'id'>) => Promise<WrestlerMedia>;
  deleteMedia: (id: string) => Promise<void>;
}

const WrestlerContext = createContext<WrestlerContextType | undefined>(undefined);

export function WrestlerProvider({ children }: { children: ReactNode }) {
  const [wrestlers, setWrestlers] = useState<Wrestler[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [media, setMedia] = useState<WrestlerMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load mock data (will be replaced with Supabase)
    const loadData = async () => {
      try {
        setIsLoading(true);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        setWrestlers(getMockWrestlers());
        setAchievements([]);
        setMedia([]);
      } catch (err) {
        setError('خطا در بارگذاری اطلاعات');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const getWrestlerById = (id: string) => wrestlers.find(w => w.id === id);
  
  const getAchievementsByWrestlerId = (id: string) => 
    achievements.filter(a => a.wrestler_id === id);
  
  const getMediaByWrestlerId = (id: string) => 
    media.filter(m => m.wrestler_id === id).sort((a, b) => a.display_order - b.display_order);

  const addWrestler = async (wrestler: Omit<Wrestler, 'id' | 'created_at' | 'updated_at'>): Promise<Wrestler> => {
    const now = new Date().toISOString();
    const newWrestler: Wrestler = {
      ...wrestler,
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
    };
    setWrestlers(prev => [...prev, newWrestler]);
    return newWrestler;
  };

  const updateWrestler = async (id: string, updates: Partial<Wrestler>): Promise<Wrestler> => {
    const updated = { ...getWrestlerById(id)!, ...updates, updated_at: new Date().toISOString() };
    setWrestlers(prev => prev.map(w => w.id === id ? updated : w));
    return updated;
  };

  const deleteWrestler = async (id: string): Promise<void> => {
    setWrestlers(prev => prev.filter(w => w.id !== id));
    setAchievements(prev => prev.filter(a => a.wrestler_id !== id));
    setMedia(prev => prev.filter(m => m.wrestler_id !== id));
  };

  const addAchievement = async (achievement: Omit<Achievement, 'id'>): Promise<Achievement> => {
    const newAchievement: Achievement = {
      ...achievement,
      id: crypto.randomUUID(),
    };
    setAchievements(prev => [...prev, newAchievement]);
    return newAchievement;
  };

  const updateAchievement = async (id: string, updates: Partial<Achievement>): Promise<Achievement> => {
    const existing = achievements.find(a => a.id === id)!;
    const updated = { ...existing, ...updates };
    setAchievements(prev => prev.map(a => a.id === id ? updated : a));
    return updated;
  };

  const deleteAchievement = async (id: string): Promise<void> => {
    setAchievements(prev => prev.filter(a => a.id !== id));
  };

  const addMedia = async (mediaItem: Omit<WrestlerMedia, 'id'>): Promise<WrestlerMedia> => {
    const newMedia: WrestlerMedia = {
      ...mediaItem,
      id: crypto.randomUUID(),
    };
    setMedia(prev => [...prev, newMedia]);
    return newMedia;
  };

  const deleteMedia = async (id: string): Promise<void> => {
    setMedia(prev => prev.filter(m => m.id !== id));
  };

  return (
    <WrestlerContext.Provider value={{
      wrestlers,
      achievements,
      media,
      isLoading,
      error,
      getWrestlerById,
      getAchievementsByWrestlerId,
      getMediaByWrestlerId,
      addWrestler,
      updateWrestler,
      deleteWrestler,
      addAchievement,
      updateAchievement,
      deleteAchievement,
      addMedia,
      deleteMedia,
    }}>
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
