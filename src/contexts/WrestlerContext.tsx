import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { iranianProvinces, wrestlingStyles, medalTypes } from '@/data/wrestlers';

export interface Wrestler {
  id: string;
  name: string;
  style: 'freestyle' | 'greco-roman';
  weight_class: string | null;
  province: string | null;
  image_url: string | null;
  bio: string | null;
  full_story: string | null;
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
  refreshWrestlers: () => Promise<void>;
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

  const fetchWrestlers = async () => {
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
      }));
      
      setWrestlers(mappedData);
    } catch (err) {
      console.error('Error fetching wrestlers:', err);
      setError('خطا در بارگذاری اطلاعات');
    }
  };

  const fetchAchievements = async () => {
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
    } catch (err) {
      console.error('Error fetching achievements:', err);
    }
  };

  const fetchMedia = async () => {
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
    } catch (err) {
      console.error('Error fetching media:', err);
    }
  };

  const refreshWrestlers = async () => {
    setIsLoading(true);
    await Promise.all([fetchWrestlers(), fetchAchievements(), fetchMedia()]);
    setIsLoading(false);
  };

  useEffect(() => {
    refreshWrestlers();
  }, []);

  const getWrestlerById = (id: string) => wrestlers.find(w => w.id === id);
  
  const getAchievementsByWrestlerId = (id: string) => 
    achievements.filter(a => a.wrestler_id === id);
  
  const getMediaByWrestlerId = (id: string) => 
    media.filter(m => m.wrestler_id === id).sort((a, b) => a.display_order - b.display_order);

  const addWrestler = async (wrestler: Omit<Wrestler, 'id' | 'created_at' | 'updated_at'>): Promise<Wrestler> => {
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
      })
      .select()
      .single();

    if (error) throw error;
    
    const newWrestler = {
      ...data,
      style: data.style as 'freestyle' | 'greco-roman',
    };
    
    setWrestlers(prev => [...prev, newWrestler]);
    return newWrestler;
  };

  const updateWrestler = async (id: string, updates: Partial<Wrestler>): Promise<Wrestler> => {
    const { data, error } = await supabase
      .from('wrestlers')
      .update({
        name: updates.name,
        style: updates.style,
        weight_class: updates.weight_class,
        province: updates.province,
        bio: updates.bio,
        full_story: updates.full_story,
        image_url: updates.image_url,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    const updated = {
      ...data,
      style: data.style as 'freestyle' | 'greco-roman',
    };
    
    setWrestlers(prev => prev.map(w => w.id === id ? updated : w));
    return updated;
  };

  const deleteWrestler = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('wrestlers')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    setWrestlers(prev => prev.filter(w => w.id !== id));
    setAchievements(prev => prev.filter(a => a.wrestler_id !== id));
    setMedia(prev => prev.filter(m => m.wrestler_id !== id));
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
    
    setAchievements(prev => [...prev, newAchievement]);
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
    
    setAchievements(prev => prev.map(a => a.id === id ? updated : a));
    return updated;
  };

  const deleteAchievement = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('achievements')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    setAchievements(prev => prev.filter(a => a.id !== id));
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
    
    setMedia(prev => [...prev, newMedia]);
    return newMedia;
  };

  const deleteMedia = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('wrestler_media')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    setMedia(prev => prev.filter(m => m.id !== id));
  };

  return (
    <WrestlerContext.Provider value={{
      wrestlers,
      achievements,
      media,
      isLoading,
      error,
      refreshWrestlers,
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
