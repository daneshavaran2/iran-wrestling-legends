import React, { forwardRef } from 'react';
import { useParallax } from '@/hooks/useParallax';
import { cn } from '@/lib/utils';

interface ParallaxCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  onClick?: () => void;
}

export const ParallaxCard = forwardRef<HTMLDivElement, ParallaxCardProps>(
  function ParallaxCard({ children, className, intensity = 12, onClick }, externalRef) {
    const { ref: internalRef, style, handlers } = useParallax(intensity);

    // Combine internal ref with external ref
    const combinedRef = (node: HTMLDivElement | null) => {
      // Set internal ref for useParallax
      if (internalRef && 'current' in internalRef) {
        (internalRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }

      // Forward to external ref if provided
      if (typeof externalRef === 'function') {
        externalRef(node);
      } else if (externalRef) {
        externalRef.current = node;
      }
    };

    return (
      <div
        ref={combinedRef}
        style={style}
        onClick={onClick}
        className={cn('transform-gpu cursor-pointer', className)}
        {...handlers}
      >
        {children}
      </div>
    );
  }
);

ParallaxCard.displayName = 'ParallaxCard';
