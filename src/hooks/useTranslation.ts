import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface TranslationCache {
  [key: string]: {
    original: string;
    en?: string;
    ar?: string;
    timestamp: number;
  };
}

const LOCAL_CACHE_KEY = 'museum-translations-cache';
const LOCAL_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// Get local cache from localStorage
const getLocalCache = (): TranslationCache => {
  try {
    const cached = localStorage.getItem(LOCAL_CACHE_KEY);
    if (!cached) return {};
    
    const parsed = JSON.parse(cached);
    const now = Date.now();
    
    // Clean expired entries
    const cleaned: TranslationCache = {};
    for (const key in parsed) {
      if (now - parsed[key].timestamp < LOCAL_CACHE_DURATION) {
        cleaned[key] = parsed[key];
      }
    }
    
    return cleaned;
  } catch {
    return {};
  }
};

// Save to localStorage
const setLocalCache = (cache: TranslationCache) => {
  try {
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Storage full, clear it
    localStorage.removeItem(LOCAL_CACHE_KEY);
  }
};

// Generate a hash key for text
const generateKey = (text: string): string => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `t_${Math.abs(hash).toString(36)}`;
};

export const useTranslation = () => {
  const { language } = useLanguage();
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedTexts, setTranslatedTexts] = useState<Record<string, string>>({});
  const pendingTranslations = useRef<Set<string>>(new Set());
  const cacheRef = useRef<TranslationCache>(getLocalCache());

  // Sync cache to localStorage periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setLocalCache(cacheRef.current);
    }, 30000); // Save every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const translateText = useCallback(async (text: string): Promise<string> => {
    // Skip if Persian or empty
    if (language === 'fa' || !text || text.trim().length < 3) {
      return text;
    }

    const key = generateKey(text);
    const targetLang = language as 'en' | 'ar';

    // 1. Check local memory cache first (fastest)
    const memCached = cacheRef.current[key];
    if (memCached && memCached[targetLang]) {
      return memCached[targetLang]!;
    }

    // 2. Check database cache (shared across devices)
    try {
      const { data: dbCached } = await supabase
        .from('translations')
        .select('translated_text')
        .eq('source_hash', key)
        .eq('language', targetLang)
        .maybeSingle();

      if (dbCached?.translated_text) {
        // Save to local cache
        cacheRef.current[key] = {
          ...cacheRef.current[key],
          original: text,
          [targetLang]: dbCached.translated_text,
          timestamp: Date.now(),
        };
        setLocalCache(cacheRef.current);
        return dbCached.translated_text;
      }
    } catch (error) {
      console.log('Database cache check failed:', error);
    }

    // 3. Translate with AI
    try {
      setIsTranslating(true);
      
      const { data, error } = await supabase.functions.invoke('translate-content', {
        body: { text, targetLanguage: targetLang }
      });

      if (error) throw error;

      const translated = data?.translatedText || text;

      // Save to database cache (for sharing across devices/users)
      try {
        await supabase.from('translations').upsert({
          source_hash: key,
          source_text: text.substring(0, 5000), // Limit text size
          language: targetLang,
          translated_text: translated,
        }, {
          onConflict: 'source_hash,language'
        });
      } catch (dbError) {
        console.log('Failed to save to database cache:', dbError);
      }

      // Save to local cache
      cacheRef.current[key] = {
        ...cacheRef.current[key],
        original: text,
        [targetLang]: translated,
        timestamp: Date.now(),
      };
      setLocalCache(cacheRef.current);

      // Update state for reactive UI
      setTranslatedTexts(prev => ({
        ...prev,
        [`${key}_${targetLang}`]: translated
      }));

      return translated;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    } finally {
      setIsTranslating(false);
    }
  }, [language]);

  const getLocalizedText = useCallback((text: string): string => {
    if (language === 'fa' || !text || text.trim().length < 3) {
      return text;
    }

    const key = generateKey(text);
    const targetLang = language as 'en' | 'ar';

    // Check local memory cache
    const cached = cacheRef.current[key];
    if (cached && cached[targetLang]) {
      return cached[targetLang]!;
    }

    // Check state
    const stateKey = `${key}_${targetLang}`;
    if (translatedTexts[stateKey]) {
      return translatedTexts[stateKey];
    }

    // Trigger background translation if not already pending
    if (!pendingTranslations.current.has(stateKey)) {
      pendingTranslations.current.add(stateKey);
      translateText(text).then(translated => {
        setTranslatedTexts(prev => ({
          ...prev,
          [stateKey]: translated
        }));
        pendingTranslations.current.delete(stateKey);
      });
    }

    // Return original while loading
    return text;
  }, [language, translatedTexts, translateText]);

  const clearCache = useCallback(() => {
    cacheRef.current = {};
    setTranslatedTexts({});
    localStorage.removeItem(LOCAL_CACHE_KEY);
  }, []);

  return {
    translateText,
    getLocalizedText,
    isTranslating,
    clearCache,
  };
};
