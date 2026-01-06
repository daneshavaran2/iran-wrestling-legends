import React from 'react';
import { useParallax } from '@/hooks/useParallax';
import { cn } from '@/lib/utils';

interface ParallaxCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  onClick?: () => void;
}

export function ParallaxCard({ 
  children, 
  className, 
  intensity = 12,
  onClick 
}: ParallaxCardProps) {
  const { ref, style, handlers } = useParallax(intensity);

  return (
    <div
      ref={ref}
      style={style}
      onClick={onClick}
      className={cn('transform-gpu cursor-pointer', className)}
      {...handlers}
    >
      {children}
    </div>
  );
}
