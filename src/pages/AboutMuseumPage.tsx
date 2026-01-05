import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Info, Loader2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GoldButton } from '@/components/ui/GoldButton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.png';

export default function AboutMuseumPage() {
  const navigate = useNavigate();

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
      <div className="max-w-4xl mx-auto mb-8">
        <GoldButton variant="ghost" onClick={() => navigate('/')}>
          <ArrowRight className="h-5 w-5 ml-2" />
          بازگشت به صفحه اصلی
        </GoldButton>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto">
        <GlassCard className="p-8 md:p-12">
          {/* Header */}
          <header className="text-center mb-12">
            <img
              src={settings?.about_image_url || logo}
              alt="موزه کشتی ایران"
              className="h-32 md:h-40 mx-auto mb-6"
            />
            <div className="inline-flex items-center gap-3 mb-4">
              <Info className="h-8 w-8 text-gold" />
              <h1 className="text-3xl md:text-4xl font-bold text-gold">
                {settings?.about_title || 'درباره موزه کشتی ایران'}
              </h1>
            </div>
          </header>

          {/* Content */}
          <div className="prose prose-lg prose-invert max-w-none text-foreground">
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
        </GlassCard>
      </main>
    </div>
  );
}
