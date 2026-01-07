import React, { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn, Grid3X3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Photo {
  id: string;
  url: string;
  caption?: string | null;
}

interface FlipBookProps {
  photos: Photo[];
  initialIndex?: number;
  onClose?: () => void;
}

export function FlipBook({ photos, initialIndex = 0, onClose }: FlipBookProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev' | null>(null);
  const [showGrid, setShowGrid] = useState(false);

  const goToNext = useCallback(() => {
    if (currentIndex < photos.length - 1 && !isFlipping) {
      setFlipDirection('next');
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setIsFlipping(false);
        setFlipDirection(null);
      }, 400);
    }
  }, [currentIndex, photos.length, isFlipping]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0 && !isFlipping) {
      setFlipDirection('prev');
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentIndex(prev => prev - 1);
        setIsFlipping(false);
        setFlipDirection(null);
      }, 400);
    }
  }, [currentIndex, isFlipping]);

  const goToIndex = useCallback((index: number) => {
    setCurrentIndex(index);
    setShowGrid(false);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToNext();
      if (e.key === 'ArrowRight') goToPrev();
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev, onClose]);

  // Touch/Swipe support
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext();
      else goToPrev();
    }
    setTouchStart(null);
  };

  const currentPhoto = photos[currentIndex];

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
                src={photo.url}
                alt={photo.caption || ''}
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
              />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Controls */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGrid(true)}
            className="p-2 text-white hover:text-gold transition-colors bg-black/50 rounded-full"
          >
            <Grid3X3 className="h-5 w-5" />
          </button>
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

      {/* Navigation Arrows */}
      {currentIndex > 0 && (
        <button
          onClick={goToPrev}
          className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-3 text-white hover:text-gold transition-colors bg-black/30 hover:bg-black/50 rounded-full z-10"
        >
          <ChevronRight className="h-8 w-8" />
        </button>
      )}
      {currentIndex < photos.length - 1 && (
        <button
          onClick={goToNext}
          className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-3 text-white hover:text-gold transition-colors bg-black/30 hover:bg-black/50 rounded-full z-10"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>
      )}

      {/* FlipBook Container */}
      <div className="relative w-full max-w-4xl h-[70vh] perspective-1000 mx-4">
        <div 
          className={cn(
            "absolute inset-0 flex items-center justify-center transition-transform duration-400 preserve-3d",
            isFlipping && flipDirection === 'next' && "animate-flip-next",
            isFlipping && flipDirection === 'prev' && "animate-flip-prev"
          )}
        >
          {/* Current Page */}
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="relative max-w-full max-h-full shadow-2xl rounded-lg overflow-hidden bg-card">
              {/* Page effect - left edge */}
              <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/20 to-transparent z-10" />
              {/* Page effect - right edge (book binding) */}
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/30 via-black/10 to-transparent z-10" />
              
              <img
                src={currentPhoto.url}
                alt={currentPhoto.caption || ''}
                className="max-w-full max-h-[60vh] object-contain"
              />
              
              {/* Page corner curl effect */}
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-br from-transparent via-transparent to-white/10 rounded-tr-full" />
            </div>
          </div>
        </div>

        {/* Caption */}
        {currentPhoto.caption && (
          <div className="absolute bottom-0 left-0 right-0 text-center p-4">
            <p className="text-white text-lg bg-black/50 inline-block px-4 py-2 rounded-lg">
              {currentPhoto.caption}
            </p>
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      <div className="absolute bottom-4 left-4 right-4 overflow-x-auto">
        <div className="flex gap-2 justify-center py-2">
          {photos.slice(Math.max(0, currentIndex - 3), Math.min(photos.length, currentIndex + 4)).map((photo, idx) => {
            const actualIndex = Math.max(0, currentIndex - 3) + idx;
            return (
              <button
                key={photo.id}
                onClick={() => setCurrentIndex(actualIndex)}
                className={cn(
                  "flex-shrink-0 w-12 h-12 md:w-16 md:h-16 rounded overflow-hidden transition-all",
                  actualIndex === currentIndex 
                    ? "ring-2 ring-gold scale-110" 
                    : "opacity-60 hover:opacity-100"
                )}
              >
                <img
                  src={photo.url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
