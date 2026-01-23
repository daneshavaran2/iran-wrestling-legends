import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Images, Loader2 } from 'lucide-react';
import { GoldButton } from '@/components/ui/GoldButton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

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
        <div className="liquid-glass p-8 rounded-3xl">
          <Loader2 className="h-12 w-12 animate-spin text-bronze" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8 page-enter">
      {/* Back Button */}
      <div className="max-w-6xl mx-auto mb-8">
        <GoldButton variant="ghost" onClick={() => navigate('/')} className="liquid-button">
          <ArrowRight className="h-5 w-5 ml-2" />
          بازگشت به صفحه اصلی
        </GoldButton>
      </div>

      {/* Title */}
      <header className="text-center mb-12 page-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl liquid-glass">
            <Images className="h-10 w-10 text-bronze" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-bronze bronze-glow">آلبوم تصاویر</h1>
        </div>
        <p className="text-lg text-muted-foreground">مجموعه تصاویر تاریخی کشتی ایران</p>
      </header>

      {/* Albums Grid */}
      <main className="max-w-6xl mx-auto">
        {albums && albums.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {albums.map((album, index) => (
              <button
                key={album.id}
                onClick={() => navigate(`/albums/${album.id}`)}
                className="text-right focus:outline-none group page-slide-up"
                style={{ animationDelay: `${0.15 + index * 0.08}s` }}
              >
                <div className="liquid-glass overflow-hidden h-full rounded-3xl">
                  <div className="aspect-video relative overflow-hidden">
                    {album.cover_image_url ? (
                      <img
                        src={album.cover_image_url}
                        alt={album.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Images className="h-16 w-16 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-bronze transition-colors">
                      {album.title}
                    </h3>
                    {album.description && (
                      <p className="text-muted-foreground text-sm line-clamp-2">
                        {album.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground/60 mt-3">
                      {(album as any).album_photos?.[0]?.count || 0} تصویر
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="liquid-glass p-12 text-center rounded-3xl">
            <Images className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">آلبومی یافت نشد</p>
          </div>
        )}
      </main>
    </div>
  );
}
