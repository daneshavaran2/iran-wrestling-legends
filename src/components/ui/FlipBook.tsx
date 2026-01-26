import React, { useState, useCallback, useEffect, useRef, memo } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, Grid3X3, Play, Pause, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTinyThumbnailUrl } from '@/utils/imageOptimizer';

interface Photo {
  id: string;
  url: string;
  thumbnailUrl?: string;
  caption?: string | null;
}

interface FlipBookProps {
  photos: Photo[];
  initialIndex?: number;
  onClose?: () => void;
}

// پیش‌بارگذاری تصویر
const preloadImage = (url: string) => {
  const img = new Image();
  img.src = url;
};

export const FlipBook = memo(function FlipBook({ photos, initialIndex = 0, onClose }: FlipBookProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev' | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Zoom states
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastPinchDistance = useRef<number | null>(null);
  const lastTouchPosition = useRef<{ x: number; y: number } | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  
  const flipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const doubleTapRef = useRef<number | null>(null);

  // Reset states when index changes
  useEffect(() => {
    setImageLoaded(false);
    resetZoom();
  }, [currentIndex]);

  // Reset zoom function
  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);
  }, []);

  // پیش‌بارگذاری تصاویر مجاور
  useEffect(() => {
    if (photos.length === 0) return;
    
    const indicesToPreload = [
      currentIndex + 1,
      currentIndex + 2,
      currentIndex - 1,
    ].filter(i => i >= 0 && i < photos.length);
    
    indicesToPreload.forEach(i => preloadImage(photos[i].url));
  }, [currentIndex, photos]);

  const goToNext = useCallback(() => {
    if (isFlipping || scale > 1) return;
    
    const nextIndex = currentIndex < photos.length - 1 ? currentIndex + 1 : 0;
    
    setFlipDirection('next');
    setIsFlipping(true);
    
    if (flipTimeoutRef.current) clearTimeout(flipTimeoutRef.current);
    
    flipTimeoutRef.current = setTimeout(() => {
      setCurrentIndex(nextIndex);
      setIsFlipping(false);
      setFlipDirection(null);
    }, 200);
  }, [currentIndex, photos.length, isFlipping, scale]);

  const goToPrev = useCallback(() => {
    if (currentIndex <= 0 || isFlipping || scale > 1) return;
    
    setFlipDirection('prev');
    setIsFlipping(true);
    
    if (flipTimeoutRef.current) clearTimeout(flipTimeoutRef.current);
    
    flipTimeoutRef.current = setTimeout(() => {
      setCurrentIndex(prev => prev - 1);
      setIsFlipping(false);
      setFlipDirection(null);
    }, 200);
  }, [currentIndex, isFlipping, scale]);

  const goToIndex = useCallback((index: number) => {
    setCurrentIndex(index);
    setShowGrid(false);
    resetZoom();
  }, [resetZoom]);

  // Zoom functions
  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.5, 4));
  }, []);

  const zoomOut = useCallback(() => {
    setScale(prev => {
      const newScale = Math.max(prev - 0.5, 1);
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newScale;
    });
  }, []);

  // Double-tap to zoom
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (scale > 1) {
      resetZoom();
    } else {
      setScale(2.5);
      // Center zoom on click position
      if (imageContainerRef.current) {
        const rect = imageContainerRef.current.getBoundingClientRect();
        const x = (rect.width / 2 - (e.clientX - rect.left)) * 0.5;
        const y = (rect.height / 2 - (e.clientY - rect.top)) * 0.5;
        setPosition({ x, y });
      }
    }
  }, [scale, resetZoom]);

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.2 : 0.2;
      setScale(prev => {
        const newScale = Math.min(Math.max(prev + delta, 1), 4);
        if (newScale === 1) {
          setPosition({ x: 0, y: 0 });
        }
        return newScale;
      });
    }
  }, []);

  // Touch handlers for pinch zoom
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch start
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      lastPinchDistance.current = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
    } else if (e.touches.length === 1) {
      // Check for double tap
      const now = Date.now();
      if (doubleTapRef.current && now - doubleTapRef.current < 300) {
        // Double tap detected
        if (scale > 1) {
          resetZoom();
        } else {
          setScale(2.5);
        }
        doubleTapRef.current = null;
      } else {
        doubleTapRef.current = now;
      }
      
      // Pan start
      if (scale > 1) {
        lastTouchPosition.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        };
        setIsDragging(true);
      }
    }
  }, [scale, resetZoom]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch zoom
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      if (lastPinchDistance.current) {
        const delta = (distance - lastPinchDistance.current) * 0.01;
        setScale(prev => {
          const newScale = Math.min(Math.max(prev + delta, 1), 4);
          if (newScale === 1) {
            setPosition({ x: 0, y: 0 });
          }
          return newScale;
        });
      }
      lastPinchDistance.current = distance;
    } else if (e.touches.length === 1 && scale > 1 && lastTouchPosition.current) {
      // Pan
      e.preventDefault();
      const deltaX = e.touches[0].clientX - lastTouchPosition.current.x;
      const deltaY = e.touches[0].clientY - lastTouchPosition.current.y;
      
      setPosition(prev => ({
        x: prev.x + deltaX / scale,
        y: prev.y + deltaY / scale
      }));
      
      lastTouchPosition.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    }
  }, [scale]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    lastPinchDistance.current = null;
    setIsDragging(false);
    
    // Swipe navigation (only when not zoomed)
    if (scale === 1 && lastTouchPosition.current && e.changedTouches.length === 1) {
      const touchEnd = e.changedTouches[0].clientX;
      const touchStart = lastTouchPosition.current.x;
      const diff = touchStart - touchEnd;
      if (Math.abs(diff) > 50) {
        if (diff > 0) goToNext();
        else goToPrev();
      }
    }
    lastTouchPosition.current = null;
  }, [scale, goToNext, goToPrev]);

  // Mouse drag for panning when zoomed
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale > 1) {
      e.preventDefault();
      lastTouchPosition.current = { x: e.clientX, y: e.clientY };
      setIsDragging(true);
    }
  }, [scale]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && scale > 1 && lastTouchPosition.current) {
      const deltaX = e.clientX - lastTouchPosition.current.x;
      const deltaY = e.clientY - lastTouchPosition.current.y;
      
      setPosition(prev => ({
        x: prev.x + deltaX / scale,
        y: prev.y + deltaY / scale
      }));
      
      lastTouchPosition.current = { x: e.clientX, y: e.clientY };
    }
  }, [isDragging, scale]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    lastTouchPosition.current = null;
  }, []);

  // Auto-play
  useEffect(() => {
    if (!isAutoPlaying || scale > 1) {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
      return;
    }

    autoPlayRef.current = setInterval(() => {
      setCurrentIndex(prev => prev < photos.length - 1 ? prev + 1 : 0);
    }, 1500);

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isAutoPlaying, photos.length, scale]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (flipTimeoutRef.current) clearTimeout(flipTimeoutRef.current);
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, []);

  const toggleAutoPlay = useCallback(() => {
    setIsAutoPlaying(prev => !prev);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToNext();
      if (e.key === 'ArrowRight') goToPrev();
      if (e.key === 'Escape') {
        if (scale > 1) {
          resetZoom();
        } else {
          onClose?.();
        }
      }
      if (e.key === ' ') {
        e.preventDefault();
        toggleAutoPlay();
      }
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        zoomIn();
      }
      if (e.key === '-') {
        e.preventDefault();
        zoomOut();
      }
      if (e.key === '0') {
        e.preventDefault();
        resetZoom();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev, onClose, toggleAutoPlay, zoomIn, zoomOut, resetZoom, scale]);

  const currentPhoto = photos[currentIndex];

  if (!currentPhoto) return null;

  if (showGrid) {
    return (
      <div className="fixed inset-0 z-50 bg-black/95 overflow-auto">
        <div className="sticky top-0 z-10 p-4 bg-gradient-to-b from-black to-transparent">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <button
              onClick={() => setShowGrid(false)}
              className="p-2 text-white hover:text-gold transition-colors"
            >
              <ZoomIn className="h-6 w-6" />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-white hover:text-gold transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>
        <div className="max-w-6xl mx-auto p-4 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              onClick={() => goToIndex(index)}
              className={cn(
                "aspect-square overflow-hidden rounded-lg transition-all",
                index === currentIndex && "ring-2 ring-gold"
              )}
            >
              <img
                src={photo.thumbnailUrl || getTinyThumbnailUrl(photo.url)}
                alt={photo.caption || ''}
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-200"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center select-none"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Controls */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGrid(true)}
            className="p-2 text-white hover:text-gold transition-colors bg-black/50 rounded-full"
            title="نمایش همه تصاویر"
          >
            <Grid3X3 className="h-5 w-5" />
          </button>
          <button
            onClick={toggleAutoPlay}
            className={cn(
              "p-2 transition-colors bg-black/50 rounded-full",
              isAutoPlaying ? "text-gold" : "text-white hover:text-gold"
            )}
            title={isAutoPlaying ? "توقف اسلایدشو" : "شروع اسلایدشو"}
          >
            {isAutoPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>
          
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-black/50 rounded-full px-1">
            <button
              onClick={zoomOut}
              disabled={scale <= 1}
              className={cn(
                "p-2 transition-colors rounded-full",
                scale <= 1 ? "text-muted-foreground" : "text-foreground hover:text-gold"
              )}
              title="کوچک‌نمایی (−)"
            >
              <ZoomOut className="h-5 w-5" />
            </button>
            <span className="text-white text-xs min-w-[3rem] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={zoomIn}
              disabled={scale >= 4}
              className={cn(
                "p-2 transition-colors rounded-full",
                scale >= 4 ? "text-muted-foreground" : "text-foreground hover:text-gold"
              )}
              title="بزرگ‌نمایی (+)"
            >
              <ZoomIn className="h-5 w-5" />
            </button>
            {scale > 1 && (
              <button
                onClick={resetZoom}
                className="p-2 text-white hover:text-gold transition-colors rounded-full"
                title="بازنشانی زوم (0)"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        
        <div className="text-white text-sm bg-black/50 px-3 py-1 rounded-full">
          {currentIndex + 1} از {photos.length}
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-white hover:text-gold transition-colors bg-black/50 rounded-full"
          >
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Navigation Arrows - hidden when zoomed */}
      {scale === 1 && currentIndex > 0 && (
        <button
          onClick={goToPrev}
          className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-3 text-white hover:text-gold transition-colors bg-black/30 hover:bg-black/50 rounded-full z-10"
        >
          <ChevronRight className="h-8 w-8" />
        </button>
      )}
      {scale === 1 && currentIndex < photos.length - 1 && (
        <button
          onClick={goToNext}
          className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-3 text-white hover:text-gold transition-colors bg-black/30 hover:bg-black/50 rounded-full z-10"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>
      )}

      {/* FlipBook Container with Zoom */}
      <div 
        ref={imageContainerRef}
        className={cn(
          "relative w-full max-w-4xl h-[70vh] perspective-1000 mx-4 overflow-hidden",
          scale > 1 && "cursor-grab",
          isDragging && "cursor-grabbing"
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
      >
        <div 
          className={cn(
            "absolute inset-0 flex items-center justify-center preserve-3d",
            !isDragging && "transition-transform duration-200",
            isFlipping && flipDirection === 'next' && scale === 1 && "animate-flip-next",
            isFlipping && flipDirection === 'prev' && scale === 1 && "animate-flip-prev"
          )}
          style={{
            transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
          }}
        >
          {/* Current Page */}
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="relative max-w-full max-h-full shadow-2xl rounded-lg overflow-hidden bg-card">
              {/* Page effect - left edge */}
              <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/20 to-transparent z-10 pointer-events-none" />
              {/* Page effect - right edge (book binding) */}
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/30 via-black/10 to-transparent z-10 pointer-events-none" />
              
              {/* Low-res placeholder */}
              {currentPhoto.thumbnailUrl && !imageLoaded && (
                <img
                  src={currentPhoto.thumbnailUrl}
                  alt=""
                  className="absolute inset-0 w-full h-full object-contain blur-sm scale-105"
                  draggable={false}
                />
              )}
              
              {/* High-res image */}
              <img
                src={currentPhoto.url}
                alt={currentPhoto.caption || ''}
                className={cn(
                  "max-w-full max-h-[60vh] object-contain transition-opacity duration-300",
                  imageLoaded ? "opacity-100" : "opacity-0"
                )}
                onLoad={() => setImageLoaded(true)}
                draggable={false}
              />
              
              {/* Page corner curl effect */}
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-br from-transparent via-transparent to-white/10 rounded-tr-full pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Zoom hint */}
        {scale === 1 && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-muted-foreground text-xs bg-background/30 px-3 py-1 rounded-full pointer-events-none">
            دوبار کلیک یا پینچ برای زوم
          </div>
        )}

        {/* Caption */}
        {currentPhoto.caption && scale === 1 && (
          <div className="absolute bottom-0 left-0 right-0 text-center p-4 pointer-events-none">
            <p className="text-white text-lg bg-black/50 inline-block px-4 py-2 rounded-lg">
              {currentPhoto.caption}
            </p>
          </div>
        )}
      </div>

      {/* Auto-play indicator */}
      {isAutoPlaying && scale === 1 && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="bg-gold/20 rounded-full px-4 py-1.5 flex items-center gap-2">
            <div className="w-2 h-2 bg-gold rounded-full animate-pulse" />
            <span className="text-gold text-sm">اسلایدشو خودکار</span>
          </div>
        </div>
      )}

      {/* Thumbnail Strip - hidden when zoomed */}
      {scale === 1 && (
        <div className="absolute bottom-4 left-4 right-4 overflow-x-auto">
          <div className="flex gap-2 justify-center py-2">
            {photos.slice(Math.max(0, currentIndex - 3), Math.min(photos.length, currentIndex + 4)).map((photo, idx) => {
              const actualIndex = Math.max(0, currentIndex - 3) + idx;
              return (
                <button
                  key={photo.id}
                  onClick={() => setCurrentIndex(actualIndex)}
                  className={cn(
                    "flex-shrink-0 w-12 h-12 md:w-16 md:h-16 rounded overflow-hidden transition-all duration-150",
                    actualIndex === currentIndex 
                      ? "ring-2 ring-gold scale-110" 
                      : "opacity-60 hover:opacity-100"
                  )}
                >
                  <img
                    src={photo.thumbnailUrl || getTinyThumbnailUrl(photo.url)}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});
