import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Info, Loader2, Play, X } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GoldButton } from '@/components/ui/GoldButton';
import { LazyImage } from '@/components/ui/LazyImage';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import logo from '@/assets/logo.png';

interface AboutMedia {
  id: string;
  type: string;
  url: string;
  title: string | null;
  display_order: number;
}

export default function AboutMuseumPage() {
  const navigate = useNavigate();
  const [lightboxMedia, setLightboxMedia] = useState<AboutMedia | null>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['app-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 'main')
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: media } = useQuery({
    queryKey: ['about-media'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('about_media')
        .select('*')
        .order('display_order');
      if (error) throw error;
      return data as AboutMedia[];
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
    <div className="min-h-screen p-4 md:p-6">
      {/* Back Button */}
      <div className="max-w-5xl mx-auto mb-6">
        <GoldButton variant="ghost" onClick={() => navigate('/')}>
          <ArrowRight className="h-5 w-5 ml-2" />
          بازگشت به صفحه اصلی
        </GoldButton>
      </div>

      {/* Content */}
      <main className="max-w-5xl mx-auto">
        <GlassCard className="p-6 md:p-8">
          {/* Header */}
          <header className="text-center mb-8">
            <img
              src={settings?.about_image_url || logo}
              alt="موزه کشتی ایران"
              className="h-24 md:h-32 mx-auto mb-4"
            />
            <div className="inline-flex items-center gap-3 mb-2">
              <Info className="h-6 w-6 text-gold" />
              <h1 className="text-2xl md:text-3xl font-bold text-gold">
                {settings?.about_title || 'درباره موزه کشتی ایران'}
              </h1>
            </div>
          </header>

          {/* Content */}
          <div className="prose prose-lg prose-invert max-w-none text-foreground mb-8">
            {settings?.about_content ? (
              <div className="whitespace-pre-wrap leading-relaxed">
                {settings.about_content}
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <p className="text-xl">
                  موزه کشتی ایران، گنجینه‌ای از تاریخ پرافتخار ورزش باستانی کشتی در ایران است.
                </p>
                <p className="mt-4">
                  این موزه با هدف حفظ و نمایش میراث پهلوانی و قهرمانی کشتی‌گیران ایرانی تأسیس شده است.
                </p>
              </div>
            )}
          </div>

          {/* Media Gallery */}
          {media && media.length > 0 && (
            <div>
              <h3 className="text-xl font-bold mb-4 text-gold">گالری رسانه</h3>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {media.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setLightboxMedia(item)}
                    className="relative aspect-square rounded-lg overflow-hidden group"
                  >
                    {item.type === 'video' ? (
                      <>
                        <video src={item.url} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
                          <Play className="h-8 w-8 text-white" />
                        </div>
                      </>
                    ) : (
                      <LazyImage
                        src={item.url}
                        alt={item.title || ''}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </GlassCard>
      </main>

      {/* Lightbox */}
      <Dialog open={!!lightboxMedia} onOpenChange={() => setLightboxMedia(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black/95">
          <button
            onClick={() => setLightboxMedia(null)}
            className="absolute top-4 right-4 z-50 p-2 bg-black/50 rounded-full hover:bg-black/80"
          >
            <X className="h-6 w-6 text-white" />
          </button>
          {lightboxMedia?.type === 'video' ? (
            <video
              src={lightboxMedia.url}
              controls
              autoPlay
              className="w-full max-h-[80vh]"
            />
          ) : (
            <img
              src={lightboxMedia?.url}
              alt={lightboxMedia?.title || ''}
              className="w-full max-h-[80vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
