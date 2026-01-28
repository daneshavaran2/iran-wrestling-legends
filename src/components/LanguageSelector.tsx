import React, { forwardRef } from 'react';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useLanguage, Language } from '@/contexts/LanguageContext';

const languages: { code: Language; name: string; flag: string }[] = [
  { code: 'fa', name: 'فارسی', flag: '🇮🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

export const LanguageSelector = forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<'button'>>(
  function LanguageSelector(props, ref) {
    const { language, setLanguage } = useLanguage();
    
    const currentLang = languages.find(l => l.code === language);

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            ref={ref}
            variant="ghost"
            size="sm"
            className="gap-2 floating-icon-glass text-foreground hover:text-primary px-4 py-2"
            {...props}
          >
            <Globe className="h-4 w-4 text-primary" />
            <span className="text-sm">{currentLang?.flag} {currentLang?.name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="bg-background/95 backdrop-blur-md border-gold/20 min-w-[150px] z-50"
        >
          {languages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`cursor-pointer gap-3 ${
                language === lang.code 
                  ? 'bg-gold/20 text-gold' 
                  : 'hover:bg-gold/10'
              }`}
            >
              <span className="text-lg">{lang.flag}</span>
              <span>{lang.name}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
);

LanguageSelector.displayName = 'LanguageSelector';
