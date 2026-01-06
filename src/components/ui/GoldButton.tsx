import React from 'react';
import { cn } from '@/lib/utils';

interface GoldButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'solid' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
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
        // Size variants
        size === 'sm' && 'px-4 py-2 text-sm',
        size === 'md' && 'px-6 py-3 text-base',
        size === 'lg' && 'px-8 py-4 text-lg',
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
