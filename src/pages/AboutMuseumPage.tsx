import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Info, Loader2, Play, X } from 'lucide-react';
import { GoldButton } from '@/components/ui/GoldButton';
import { LazyImage } from '@/components/ui/LazyImage';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
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
        <div className="liquid-glass p-8 rounded-3xl">
          <Loader2 className="h-12 w-12 animate-spin text-bronze" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 page-enter">
      {/* Back Button */}
      <div className="max-w-5xl mx-auto mb-6">
        <GoldButton variant="ghost" onClick={() => navigate('/')} className="liquid-button">
          <ArrowRight className="h-5 w-5 ml-2" />
          بازگشت به صفحه اصلی
        </GoldButton>
      </div>

      {/* Content */}
      <main className="max-w-5xl mx-auto">
        <div className="liquid-glass p-6 md:p-8 rounded-3xl page-slide-up" style={{ animationDelay: '0.1s' }}>
          {/* Header */}
          <header className="text-center mb-8">
            <img
              src={settings?.about_image_url || logo}
              alt="موزه کشتی ایران"
              className="h-24 md:h-32 mx-auto mb-4"
            />
            <div className="inline-flex items-center gap-3 mb-2">
              <div className="p-2 rounded-2xl liquid-glass">
                <Info className="h-6 w-6 text-bronze" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-bronze bronze-glow">
                {settings?.about_title || 'درباره موزه کشتی ایران'}
              </h1>
            </div>
          </header>

          {/* Content */}
          <div className="prose prose-lg prose-invert max-w-none text-foreground mb-8 page-slide-up" style={{ animationDelay: '0.2s' }}>
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
            <div className="page-slide-up" style={{ animationDelay: '0.3s' }}>
              <h3 className="text-xl font-bold mb-4 text-bronze">گالری رسانه</h3>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {media.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => setLightboxMedia(item)}
                    className="relative aspect-square rounded-2xl overflow-hidden group liquid-glass page-slide-up"
                    style={{ animationDelay: `${0.35 + index * 0.05}s` }}
                  >
                    {item.type === 'video' ? (
                      <>
                        <video src={item.url} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
                          <div className="p-3 rounded-full gold-button">
                            <Play className="h-6 w-6" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <LazyImage
                        src={item.url}
                        alt={item.title || ''}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Lightbox */}
      <Dialog open={!!lightboxMedia} onOpenChange={() => setLightboxMedia(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black/95 border-bronze/20">
          <button
            onClick={() => setLightboxMedia(null)}
            className="absolute top-4 right-4 z-50 p-2 liquid-glass rounded-full hover:bg-bronze/20"
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
