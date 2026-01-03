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
        'relative overflow-hidden rounded-xl font-medium transition-all duration-[240ms] disabled:opacity-50 disabled:cursor-not-allowed',
        // Size variants
        size === 'sm' && 'px-4 py-2 text-sm',
        size === 'md' && 'px-6 py-3 text-base',
        size === 'lg' && 'px-8 py-4 text-lg',
        // Style variants
        variant === 'solid' && 'gold-button',
        variant === 'outline' && 'glass-button border-primary/50 text-primary hover:bg-primary/10',
        variant === 'ghost' && 'bg-transparent text-primary hover:bg-primary/10',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
