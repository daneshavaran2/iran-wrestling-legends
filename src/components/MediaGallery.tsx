import React, { useState, useEffect, useRef } from 'react';
import { X, Play, ChevronRight, ChevronLeft, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LazyImage } from './ui/LazyImage';
import { GoldButton } from './ui/GoldButton';
import { resolveBundledVideo, resolveBundledVideoAsync, markBundledVideoBroken } from '@/lib/bundledVideos';

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string | null;
  title?: string | null;
}

interface MediaGalleryProps {
  items: MediaItem[];
  onDelete?: (id: string) => void;
  canDelete?: boolean;
  className?: string;
}

export function MediaGallery({
  items,
  onDelete,
  canDelete = false,
  className,
}: MediaGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [videoSrc, setVideoSrc] = useState<string>('');
  const triedRemoteRef = useRef(false);

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = '';
  };

  const goNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const goPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') goPrev();
    if (e.key === 'ArrowLeft') goNext();
    if (e.key === 'Escape') closeLightbox();
  };

  if (items.length === 0) return null;

  const currentItem = items[currentIndex];

  // Resolve current video URL with local-first + remote fallback
  useEffect(() => {
    if (!currentItem || currentItem.type !== 'video') return;
    triedRemoteRef.current = false;
    setVideoSrc(resolveBundledVideo(currentItem.url));
    let cancelled = false;
    resolveBundledVideoAsync(currentItem.url).then((r) => {
      if (!cancelled) setVideoSrc(r || currentItem.url);
    });
    return () => { cancelled = true; };
  }, [currentItem]);

  const handleVideoError = () => {
    if (!currentItem) return;
    if (!triedRemoteRef.current && videoSrc && videoSrc !== currentItem.url) {
      triedRemoteRef.current = true;
      markBundledVideoBroken(currentItem.url);
      setVideoSrc(currentItem.url);
    }
  };

  return (
    <>
      {/* Grid */}
      <div className={cn(
        'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4',
        className
      )}>
        {items.map((item, index) => (
          <div
            key={item.id}
            className="relative group aspect-square cursor-pointer overflow-hidden rounded-xl"
            onClick={() => openLightbox(index)}
          >
            <LazyImage
              src={item.type === 'video' ? (item.thumbnail || undefined) : item.url}
              alt={item.title || 'رسانه'}
              className="w-full h-full transition-transform duration-300 group-hover:scale-110"
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
            
            {/* Video Play Icon */}
            {item.type === 'video' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                  <Play className="h-6 w-6 text-foreground mr-[-2px]" fill="currentColor" />
                </div>
              </div>
            )}

            {/* Delete Button */}
            {canDelete && onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item.id);
                }}
                className="absolute top-2 left-2 p-2 rounded-full bg-destructive/90 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}

            {/* Title */}
            {item.title && (
              <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                <p className="text-sm text-white truncate">{item.title}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxOpen && currentItem && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
          >
            <X className="h-6 w-6 text-white" />
          </button>

          {/* Counter */}
          <div className="absolute top-4 right-4 px-4 py-2 rounded-full bg-white/10 text-white text-sm">
            {currentIndex + 1} / {items.length}
          </div>

          {/* Navigation */}
          {items.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ChevronLeft className="h-8 w-8 text-white" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ChevronRight className="h-8 w-8 text-white" />
              </button>
            </>
          )}

          {/* Content */}
          <div 
            className="max-w-[90vw] max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {currentItem.type === 'image' ? (
              <img
                src={currentItem.url}
                alt={currentItem.title || 'تصویر'}
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
              />
            ) : (
              <video
                src={videoSrc || currentItem.url}
                poster={currentItem.thumbnail || undefined}
                controls
                autoPlay
                onError={handleVideoError}
                className="max-w-full max-h-[85vh] rounded-lg"
              />
            )}
          </div>

          {/* Title */}
          {currentItem.title && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-white/10 text-white">
              {currentItem.title}
            </div>
          )}
        </div>
      )}
    </>
  );
}
