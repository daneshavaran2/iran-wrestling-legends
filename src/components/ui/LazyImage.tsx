import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
  /** Low-res thumbnail for progressive loading */
  thumbnailSrc?: string;
  /** Maximum retry attempts on error */
  maxRetries?: number;
}

export function LazyImage({ 
  src, 
  alt, 
  className, 
  fallback = '/placeholder.svg',
  thumbnailSrc,
  maxRetries = 2,
  ...props 
}: LazyImageProps) {
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [currentSrc, setCurrentSrc] = useState(src);
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

  // Reset state when src changes
  useEffect(() => {
    setCurrentSrc(src);
    setIsLoaded(false);
    setThumbnailLoaded(false);
    setHasError(false);
    setRetryCount(0);
  }, [src]);

  const handleError = useCallback(() => {
    if (retryCount < maxRetries && currentSrc && currentSrc !== fallback) {
      // Retry with cache-busting parameter
      setRetryCount(prev => prev + 1);
      setIsLoaded(false);
      
      const retryDelay = 500 * (retryCount + 1);
      setTimeout(() => {
        const separator = currentSrc.includes('?') ? '&' : '?';
        setCurrentSrc(`${src}${separator}retry=${retryCount + 1}&t=${Date.now()}`);
      }, retryDelay);
    } else {
      // Use fallback after max retries
      setHasError(true);
      setIsLoaded(true);
    }
  }, [retryCount, maxRetries, currentSrc, src, fallback]);

  const imageSrc = hasError ? fallback : (currentSrc || fallback);

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
            onError={handleError}
            loading="lazy"
            decoding="async"
            {...props}
          />
        </>
      )}
    </div>
  );
}
