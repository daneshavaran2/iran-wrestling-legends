import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MusicSettings {
  bg_music_url: string | null;
  bg_music_enabled: boolean;
  bg_music_volume: number;
  bg_music_autoplay: boolean;
}

export function useBackgroundMusic() {
  const [settings, setSettings] = useState<MusicSettings | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch settings from database
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('bg_music_url, bg_music_enabled, bg_music_volume, bg_music_autoplay')
          .single();

        if (error) throw error;

        setSettings(data as MusicSettings);
      } catch (error) {
        console.error('Error fetching music settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Initialize audio element
  useEffect(() => {
    if (!settings?.bg_music_url || !settings.bg_music_enabled) return;

    const audio = new Audio(settings.bg_music_url);
    audio.loop = true;
    audio.volume = settings.bg_music_volume ?? 0.3;
    audioRef.current = audio;

    // Check localStorage for user preference
    const userMuted = localStorage.getItem('museum-music-muted') === 'true';
    
    // Autoplay if enabled and user hasn't muted
    if (settings.bg_music_autoplay && !userMuted) {
      audio.play()
        .then(() => setIsPlaying(true))
        .catch((e) => {
          console.log('Autoplay blocked:', e);
          // Try to play on first user interaction
          const playOnInteraction = () => {
            if (audioRef.current && !userMuted) {
              audioRef.current.play()
                .then(() => setIsPlaying(true))
                .catch(console.error);
            }
            document.removeEventListener('click', playOnInteraction);
            document.removeEventListener('touchstart', playOnInteraction);
          };
          document.addEventListener('click', playOnInteraction);
          document.addEventListener('touchstart', playOnInteraction);
        });
    }

    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, [settings]);

  const toggle = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      localStorage.setItem('museum-music-muted', 'true');
    } else {
      audioRef.current.play().catch(console.error);
      localStorage.setItem('museum-music-muted', 'false');
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const updateVolume = useCallback((volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, []);

  return {
    isPlaying,
    isEnabled: settings?.bg_music_enabled ?? false,
    audioUrl: settings?.bg_music_url ?? null,
    volume: settings?.bg_music_volume ?? 0.3,
    autoplay: settings?.bg_music_autoplay ?? false,
    toggle,
    updateVolume,
    isLoading,
  };
}
