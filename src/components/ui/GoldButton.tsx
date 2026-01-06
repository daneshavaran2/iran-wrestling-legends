import React from 'react';
import { cn } from '@/lib/utils';

interface GoldButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'solid' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'kiosk';
}

export function GoldButton({ 
  children, 
  className, 
  variant = 'solid',
  size = 'md',
  ...props 
}: GoldButtonProps) {
  return (
    <button
      className={cn(
        'relative overflow-hidden rounded-2xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed',
        // Size variants - Optimized for kiosk touch
        size === 'sm' && 'px-4 py-2.5 text-sm xl:px-5 xl:py-3 xl:text-base',
        size === 'md' && 'px-6 py-3 text-base xl:px-7 xl:py-4 xl:text-lg',
        size === 'lg' && 'px-8 py-4 text-lg xl:px-10 xl:py-5 xl:text-xl',
        size === 'kiosk' && 'px-10 py-5 text-xl xl:px-12 xl:py-6 xl:text-2xl min-h-[64px]',
        // Style variants - iOS 26 Liquid Glass
        variant === 'solid' && 'gold-button',
        variant === 'outline' && 'liquid-button border-bronze/30 text-bronze hover:border-bronze/50',
        variant === 'ghost' && 'liquid-button bg-transparent hover:bg-bronze/10',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
