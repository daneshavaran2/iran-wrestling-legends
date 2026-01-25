import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface TranslationCache {
  [key: string]: {
    en?: string;
    ar?: string;
    timestamp: number;
  };
}

const CACHE_KEY = 'translation_cache';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

const getCache = (): TranslationCache => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      // Clean expired entries
      const now = Date.now();
      const cleaned: TranslationCache = {};
      for (const [key, value] of Object.entries(parsed)) {
        const entry = value as TranslationCache[string];
        if (now - entry.timestamp < CACHE_DURATION) {
          cleaned[key] = entry;
        }
      }
      return cleaned;
    }
  } catch (e) {
    console.error('Error reading translation cache:', e);
  }
  return {};
};

const setCache = (cache: TranslationCache) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.error('Error saving translation cache:', e);
  }
};

const generateKey = (text: string): string => {
  // Create a simple hash for the text
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `t_${hash}_${text.substring(0, 20)}`;
};

export const useTranslation = () => {
  const { language } = useLanguage();
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedTexts, setTranslatedTexts] = useState<{ [key: string]: string }>({});
  const pendingTranslations = useRef<Set<string>>(new Set());
  const cacheRef = useRef<TranslationCache>(getCache());

  const translateText = useCallback(async (text: string): Promise<string> => {
    if (!text || language === 'fa') return text;
    
    const key = generateKey(text);
    
    // Check memory cache first
    const cached = cacheRef.current[key];
    if (cached && cached[language as 'en' | 'ar']) {
      return cached[language as 'en' | 'ar']!;
    }

    // Avoid duplicate requests
    if (pendingTranslations.current.has(key)) {
      return text;
    }

    pendingTranslations.current.add(key);
    setIsTranslating(true);

    try {
      const response = await supabase.functions.invoke('translate-content', {
        body: { text, targetLanguage: language }
      });

      if (response.error) {
        console.error('Translation error:', response.error);
        return text;
      }

      const translatedText = response.data?.translatedText || text;
      
      // Update cache
      cacheRef.current[key] = {
        ...cacheRef.current[key],
        [language]: translatedText,
        timestamp: Date.now()
      };
      setCache(cacheRef.current);

      // Update state
      setTranslatedTexts(prev => ({ ...prev, [`${key}_${language}`]: translatedText }));
      
      return translatedText;
    } catch (error) {
      console.error('Translation failed:', error);
      return text;
    } finally {
      pendingTranslations.current.delete(key);
      setIsTranslating(false);
    }
  }, [language]);

  const getLocalizedText = useCallback((text: string): string => {
    if (!text || language === 'fa') return text;
    
    const key = generateKey(text);
    const stateKey = `${key}_${language}`;
    
    // Check state first
    if (translatedTexts[stateKey]) {
      return translatedTexts[stateKey];
    }
    
    // Check cache
    const cached = cacheRef.current[key];
    if (cached && cached[language as 'en' | 'ar']) {
      return cached[language as 'en' | 'ar']!;
    }
    
    // Trigger translation in background
    translateText(text);
    
    return text; // Return original while translating
  }, [language, translatedTexts, translateText]);

  const clearCache = useCallback(() => {
    cacheRef.current = {};
    localStorage.removeItem(CACHE_KEY);
    setTranslatedTexts({});
  }, []);

  return {
    translateText,
    getLocalizedText,
    isTranslating,
    clearCache
  };
};
