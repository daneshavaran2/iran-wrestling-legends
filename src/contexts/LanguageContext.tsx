import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import faTranslations from '@/locales/fa.json';
import enTranslations from '@/locales/en.json';
import arTranslations from '@/locales/ar.json';

export type Language = 'fa' | 'en' | 'ar';

type TranslationsType = typeof faTranslations;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'rtl' | 'ltr';
}

const translations: Record<Language, TranslationsType> = {
  fa: faTranslations,
  en: enTranslations,
  ar: arTranslations,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_KEY = 'museum-language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    if (saved && ['fa', 'en', 'ar'].includes(saved)) {
      return saved as Language;
    }
    return 'fa';
  });

  const dir = language === 'en' ? 'ltr' : 'rtl';

  useEffect(() => {
    localStorage.setItem(LANGUAGE_KEY, language);
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', language);
    
    // Update font family based on language
    if (language === 'en') {
      document.documentElement.style.fontFamily = 'Inter, system-ui, sans-serif';
    } else {
      document.documentElement.style.fontFamily = 'Vazirmatn, system-ui, sans-serif';
    }
  }, [language, dir]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const t = useCallback((key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to Persian if key not found
        value = translations.fa;
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return key; // Return key if translation not found
          }
        }
        break;
      }
    }
    
    return typeof value === 'string' ? value : key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
