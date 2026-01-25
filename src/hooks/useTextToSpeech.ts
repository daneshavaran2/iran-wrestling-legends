import { useState, useCallback, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface UseTextToSpeechReturn {
  speak: (text: string) => void;
  stop: () => void;
  isPlaying: boolean;
  isSupported: boolean;
}

// Language to voice mapping
const languageVoiceMap: { [key: string]: string[] } = {
  fa: ['fa-IR', 'fa', 'ar-SA', 'ar'], // Persian, fallback to Arabic
  en: ['en-US', 'en-GB', 'en'],
  ar: ['ar-SA', 'ar-AE', 'ar']
};

export const useTextToSpeech = (): UseTextToSpeechReturn => {
  const { language } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Get best available voice for the language
  const getVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (!isSupported) return null;
    
    const voices = window.speechSynthesis.getVoices();
    const preferredLangs = languageVoiceMap[language] || ['en-US'];
    
    for (const lang of preferredLangs) {
      const voice = voices.find(v => v.lang.startsWith(lang));
      if (voice) return voice;
    }
    
    // Fallback to any available voice
    return voices[0] || null;
  }, [language, isSupported]);

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  }, [isSupported]);

  const speak = useCallback((text: string) => {
    if (!isSupported || !text) return;

    // Stop any ongoing speech
    stop();

    // Create new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Set voice and language
    const voice = getVoice();
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      // Set language hint even without voice
      utterance.lang = languageVoiceMap[language]?.[0] || 'en-US';
    }

    // Configure speech
    utterance.rate = language === 'ar' ? 0.9 : 1; // Slightly slower for Arabic
    utterance.pitch = 1;
    utterance.volume = 1;

    // Event handlers
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      setIsPlaying(false);
    };

    // Speak
    window.speechSynthesis.speak(utterance);
  }, [isSupported, language, getVoice, stop]);

  // Load voices (they may load asynchronously)
  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      stop();
    };
  }, [isSupported, stop]);

  return {
    speak,
    stop,
    isPlaying,
    isSupported
  };
};
