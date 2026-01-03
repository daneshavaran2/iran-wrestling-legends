import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
}

export function LazyImage({ 
  src, 
  alt, 
  className, 
  fallback = '/placeholder.svg',
  ...props 
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {!isLoaded && (
        <div className="absolute inset-0 skeleton" />
      )}
      <img
        src={hasError ? fallback : (src || fallback)}
        alt={alt}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setHasError(true);
          setIsLoaded(true);
        }}
        loading="lazy"
        {...props}
      />
    </div>
  );
}
