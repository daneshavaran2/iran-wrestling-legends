import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';
import { Loader2 } from 'lucide-react';

interface TranslatedContentProps {
  text: string | null | undefined;
  className?: string;
  as?: 'span' | 'p' | 'div' | 'h1' | 'h2' | 'h3' | 'h4';
  showLoading?: boolean;
}

export const TranslatedContent: React.FC<TranslatedContentProps> = ({
  text,
  className = '',
  as: Component = 'span',
  showLoading = false
}) => {
  const { language } = useLanguage();
  const { getLocalizedText, isTranslating } = useTranslation();
  const [displayText, setDisplayText] = useState(text || '');

  useEffect(() => {
    if (!text) {
      setDisplayText('');
      return;
    }

    if (language === 'fa') {
      setDisplayText(text);
      return;
    }

    const localizedText = getLocalizedText(text);
    setDisplayText(localizedText);
  }, [text, language, getLocalizedText]);

  if (!text) return null;

  return (
    <Component className={className}>
      {displayText}
      {showLoading && isTranslating && displayText === text && language !== 'fa' && (
        <Loader2 className="inline-block h-3 w-3 mr-1 animate-spin opacity-50" />
      )}
    </Component>
  );
};

// Simple hook for one-off translations
export const useTranslatedText = (text: string | null | undefined): string => {
  const { language } = useLanguage();
  const { getLocalizedText } = useTranslation();
  const [translatedText, setTranslatedText] = useState(text || '');

  useEffect(() => {
    if (!text) {
      setTranslatedText('');
      return;
    }

    if (language === 'fa') {
      setTranslatedText(text);
      return;
    }

    setTranslatedText(getLocalizedText(text));
  }, [text, language, getLocalizedText]);

  return translatedText;
};
