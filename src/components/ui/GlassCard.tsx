import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'subtle' | 'bronze' | 'liquid';
  hover?: boolean;
}

export function GlassCard({ 
  children, 
  className, 
  variant = 'default',
  hover = false,
  ...props 
}: GlassCardProps) {
  return (
    <div
      className={cn(
        'transition-all duration-400',
        // Variant styles - iOS 26 Liquid Glass Design
        variant === 'liquid' && 'liquid-glass rounded-3xl',
        variant === 'bronze' && 'bronze-card rounded-2xl',
        variant === 'default' && 'glass-card rounded-2xl',
        variant === 'elevated' && 'liquid-glass rounded-3xl shadow-xl',
        variant === 'subtle' && 'glass-card rounded-2xl bg-opacity-30',
        // Hover effects
        hover && variant === 'liquid' && 'hover:scale-[1.02] cursor-pointer',
        hover && variant === 'bronze' && 'hover:scale-[1.02] cursor-pointer',
        hover && variant !== 'liquid' && variant !== 'bronze' && 'hover:scale-[1.02] hover:border-bronze/30 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
