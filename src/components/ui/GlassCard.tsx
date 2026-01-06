import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'subtle' | 'bronze';
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
        'transition-all duration-[240ms]',
        variant === 'bronze' ? 'bronze-card rounded-2xl' : 'glass-card',
        variant === 'elevated' && 'shadow-glass-lg',
        variant === 'subtle' && 'bg-opacity-40',
        hover && variant === 'bronze' && 'hover:scale-[1.02] hover:shadow-bronze-lg',
        hover && variant !== 'bronze' && 'hover:scale-[1.02] hover:shadow-glass-lg hover:border-bronze/30',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
