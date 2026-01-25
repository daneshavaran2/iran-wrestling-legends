import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GoldButton } from '@/components/ui/GoldButton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { FlipBook } from '@/components/ui/FlipBook';
import { LazyImage } from '@/components/ui/LazyImage';
import { getMediumUrl, getThumbnailUrl, getFullUrl } from '@/utils/imageOptimizer';

export default function AlbumGalleryPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const { data: album, isLoading } = useQuery({
    queryKey: ['album', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('albums')
        .select('*, album_photos(*)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const photos = album?.album_photos?.sort((a: any, b: any) => a.display_order - b.display_order) || [];

  const handlePrev = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < photos.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!album) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">آلبوم یافت نشد</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      {/* Back Button */}
      <div className="max-w-6xl mx-auto mb-8">
        <GoldButton variant="ghost" onClick={() => navigate('/albums')}>
          <ArrowRight className="h-5 w-5 ml-2" />
          بازگشت به آلبوم‌ها
        </GoldButton>
      </div>

      {/* Title */}
      <header className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gold mb-4">{album.title}</h1>
        {album.description && (
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {album.description}
          </p>
        )}
      </header>

      {/* Photos Grid */}
      <main className="max-w-6xl mx-auto">
        {photos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo: any, index: number) => (
              <button
                key={photo.id}
                onClick={() => setSelectedIndex(index)}
                className="aspect-square relative overflow-hidden rounded-xl group focus:outline-none"
              >
                <LazyImage
                  src={getMediumUrl(photo.url)}
                  thumbnailSrc={getThumbnailUrl(photo.url)}
                  alt={photo.caption || `تصویر ${index + 1}`}
                  className="w-full h-full transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                {photo.caption && (
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-sm truncate">{photo.caption}</p>
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : (
          <GlassCard className="p-12 text-center">
            <p className="text-muted-foreground">تصویری در این آلبوم وجود ندارد</p>
          </GlassCard>
        )}
      </main>

      {/* FlipBook Modal */}
      {selectedIndex !== null && (
        <FlipBook
          photos={photos.map((p: any) => ({ 
            id: p.id, 
            url: getFullUrl(p.url), 
            thumbnailUrl: getThumbnailUrl(p.url),
            caption: p.caption 
          }))}
          initialIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </div>
  );
}
