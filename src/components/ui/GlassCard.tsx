import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'subtle';
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
        'glass-card transition-all duration-[240ms]',
        variant === 'elevated' && 'shadow-glass-lg',
        variant === 'subtle' && 'bg-opacity-40',
        hover && 'hover:scale-[1.02] hover:shadow-glass-lg hover:border-primary/30',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
