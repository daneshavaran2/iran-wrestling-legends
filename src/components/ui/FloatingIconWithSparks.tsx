import React, { useMemo, useState, useEffect, forwardRef, memo } from 'react';
import { cn } from '@/lib/utils';

interface FloatingIconWithSparksProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  title?: string;
  sparkCount?: number;
}

const FloatingIconWithSparksInner = forwardRef<HTMLButtonElement, FloatingIconWithSparksProps>(({ 
  children, 
  className,
  onClick,
  title,
  sparkCount = 6
}, ref) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const sparks = useMemo(() => {
    if (prefersReducedMotion) return [];
    return Array.from({ length: sparkCount }, (_, i) => ({
      id: i,
      angle: (i * (360 / sparkCount)) + Math.random() * 20 - 10,
      distance: 28 + Math.random() * 8,
      size: 2 + Math.random() * 2,
      delay: Math.random() * 2,
      duration: 1.5 + Math.random() * 1.5,
    }));
  }, [sparkCount, prefersReducedMotion]);

  return (
    <div className="relative">
      {/* Spark particles orbiting the button */}
      {!prefersReducedMotion && sparks.map((spark) => {
        const x = Math.cos(spark.angle * Math.PI / 180) * spark.distance;
        const y = Math.sin(spark.angle * Math.PI / 180) * spark.distance;
        return (
          <div
            key={spark.id}
            className="absolute rounded-full bg-primary pointer-events-none animate-spark-orbit"
            style={{
              left: `calc(50% + ${x}px - ${spark.size / 2}px)`,
              top: `calc(50% + ${y}px - ${spark.size / 2}px)`,
              width: `${spark.size}px`,
              height: `${spark.size}px`,
              animationDelay: `${spark.delay}s`,
              animationDuration: `${spark.duration}s`,
              boxShadow: `0 0 ${spark.size * 2}px hsl(20 100% 55% / 0.6)`,
            }}
          />
        );
      })}
      
      {/* Main button */}
      <button
        ref={ref}
        onClick={onClick}
        className={cn("p-4 floating-icon-glass", className)}
        title={title}
      >
        {children}
      </button>
    </div>
  );
});

FloatingIconWithSparksInner.displayName = 'FloatingIconWithSparks';

// Export memoized component
export const FloatingIconWithSparks = memo(FloatingIconWithSparksInner);
