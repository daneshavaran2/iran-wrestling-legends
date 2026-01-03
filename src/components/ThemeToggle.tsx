import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        p-3 rounded-full transition-all duration-300
        bg-card/50 backdrop-blur-sm border border-gold/20
        hover:bg-gold/20 hover:border-gold/40
        active:scale-95
        ${className}
      `}
      aria-label={resolvedTheme === 'dark' ? 'فعال کردن حالت روز' : 'فعال کردن حالت شب'}
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="w-5 h-5 2xl:w-6 2xl:h-6 text-gold" />
      ) : (
        <Moon className="w-5 h-5 2xl:w-6 2xl:h-6 text-gold" />
      )}
    </button>
  );
};

export default ThemeToggle;
