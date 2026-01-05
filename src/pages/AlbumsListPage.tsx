import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Images, Loader2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GoldButton } from '@/components/ui/GoldButton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function AlbumsListPage() {
  const navigate = useNavigate();

  const { data: albums, isLoading } = useQuery({
    queryKey: ['albums'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('albums')
        .select('*, album_photos(count)')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      {/* Back Button */}
      <div className="max-w-6xl mx-auto mb-8">
        <GoldButton variant="ghost" onClick={() => navigate('/')}>
          <ArrowRight className="h-5 w-5 ml-2" />
          بازگشت به صفحه اصلی
        </GoldButton>
      </div>

      {/* Title */}
      <header className="text-center mb-12">
        <div className="inline-flex items-center gap-3 mb-4">
          <Images className="h-10 w-10 text-gold" />
          <h1 className="text-4xl md:text-5xl font-bold text-gold">آلبوم تصاویر</h1>
        </div>
        <p className="text-lg text-muted-foreground">مجموعه تصاویر تاریخی کشتی ایران</p>
      </header>

      {/* Albums Grid */}
      <main className="max-w-6xl mx-auto">
        {albums && albums.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {albums.map((album) => (
              <button
                key={album.id}
                onClick={() => navigate(`/albums/${album.id}`)}
                className="text-right focus:outline-none group"
              >
                <GlassCard hover className="overflow-hidden h-full">
                  <div className="aspect-video relative">
                    {album.cover_image_url ? (
                      <img
                        src={album.cover_image_url}
                        alt={album.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Images className="h-16 w-16 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                  <div className="p-4">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-gold transition-colors">
                      {album.title}
                    </h3>
                    {album.description && (
                      <p className="text-muted-foreground text-sm line-clamp-2">
                        {album.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground/60 mt-2">
                      {(album as any).album_photos?.[0]?.count || 0} تصویر
                    </p>
                  </div>
                </GlassCard>
              </button>
            ))}
          </div>
        ) : (
          <GlassCard className="p-12 text-center">
            <Images className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">آلبومی یافت نشد</p>
          </GlassCard>
        )}
      </main>
    </div>
  );
}
