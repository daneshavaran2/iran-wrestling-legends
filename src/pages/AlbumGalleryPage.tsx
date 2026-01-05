import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GoldButton } from '@/components/ui/GoldButton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
                <img
                  src={photo.url}
                  alt={photo.caption || `تصویر ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
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

      {/* Lightbox Modal */}
      {selectedIndex !== null && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setSelectedIndex(null)}
        >
          <button
            onClick={() => setSelectedIndex(null)}
            className="absolute top-4 right-4 p-2 text-white hover:text-gold transition-colors"
          >
            <X className="h-8 w-8" />
          </button>

          {selectedIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white hover:text-gold transition-colors"
            >
              <ChevronRight className="h-10 w-10" />
            </button>
          )}

          {selectedIndex < photos.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white hover:text-gold transition-colors"
            >
              <ChevronLeft className="h-10 w-10" />
            </button>
          )}

          <div className="max-w-5xl max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={photos[selectedIndex].url}
              alt={photos[selectedIndex].caption || ''}
              className="max-w-full max-h-[80vh] object-contain mx-auto"
            />
            {photos[selectedIndex].caption && (
              <p className="text-center text-white mt-4">{photos[selectedIndex].caption}</p>
            )}
            <p className="text-center text-muted-foreground text-sm mt-2">
              {selectedIndex + 1} از {photos.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
