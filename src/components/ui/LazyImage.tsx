import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
  /** Low-res thumbnail for progressive loading */
  thumbnailSrc?: string;
}

export function LazyImage({ 
  src, 
  alt, 
  className, 
  fallback = '/placeholder.svg',
  thumbnailSrc,
  ...props 
}: LazyImageProps) {
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' } // Increased for earlier loading
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const imageSrc = hasError ? fallback : (src || fallback);

  return (
    <div ref={containerRef} className={cn('relative overflow-hidden', className)}>
      {/* Skeleton loader */}
      {!isLoaded && !thumbnailLoaded && (
        <div className="absolute inset-0 skeleton" />
      )}
      
      {isInView && (
        <>
          {/* Low-res thumbnail (loads fast, shows blurred) */}
          {thumbnailSrc && !isLoaded && (
            <img
              src={thumbnailSrc}
              alt={alt}
              className={cn(
                'absolute inset-0 w-full h-full object-cover transition-opacity duration-200 blur-[2px] scale-105',
                thumbnailLoaded ? 'opacity-100' : 'opacity-0'
              )}
              onLoad={() => setThumbnailLoaded(true)}
              loading="lazy"
              decoding="async"
            />
          )}
          
          {/* High-res image */}
          <img
            src={imageSrc}
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
            decoding="async"
            {...props}
          />
        </>
      )}
    </div>
  );
}
