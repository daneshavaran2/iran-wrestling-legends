import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, ChevronLeft, Play, X } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GoldButton } from '@/components/ui/GoldButton';
import { LazyImage } from '@/components/ui/LazyImage';
import { useKioskMode } from '@/hooks/useKioskMode';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface HistorySection {
  id: string;
  parent_id: string | null;
  title: string;
  slug: string;
  highlighted_quote: string | null;
  content: string | null;
  display_order: number;
}

interface HistoryMedia {
  id: string;
  type: string;
  url: string;
  title: string | null;
  display_order: number;
}

export default function HistoryDetailPage() {
  useKioskMode();
  const { slug } = useParams();
  const navigate = useNavigate();
  const [section, setSection] = useState<HistorySection | null>(null);
  const [childSections, setChildSections] = useState<HistorySection[]>([]);
  const [allSections, setAllSections] = useState<HistorySection[]>([]);
  const [media, setMedia] = useState<HistoryMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lightboxMedia, setLightboxMedia] = useState<HistoryMedia | null>(null);

  useEffect(() => {
    fetchData();
  }, [slug]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch current section
      const { data: sectionData, error: sectionError } = await supabase
        .from('history_sections')
        .select('*')
        .eq('slug', slug)
        .single();

      if (sectionError) throw sectionError;
      setSection(sectionData);

      // Fetch child sections if this is a parent
      const { data: childData } = await supabase
        .from('history_sections')
        .select('*')
        .eq('parent_id', sectionData.id)
        .order('display_order');

      setChildSections(childData || []);

      // Fetch all root sections for navigation
      const { data: allData } = await supabase
        .from('history_sections')
        .select('*')
        .is('parent_id', null)
        .order('display_order');

      setAllSections(allData || []);

      // Fetch media for this section
      const { data: mediaData } = await supabase
        .from('history_media')
        .select('*')
        .eq('section_id', sectionData.id)
        .order('display_order');

      setMedia(mediaData || []);
    } catch (error) {
      console.error('Error fetching history section:', error);
      navigate('/history');
    } finally {
      setIsLoading(false);
    }
  };

  const currentIndex = allSections.findIndex(s => s.slug === slug);
  const prevSection = currentIndex > 0 ? allSections[currentIndex - 1] : null;
  const nextSection = currentIndex < allSections.length - 1 ? allSections[currentIndex + 1] : null;

  if (isLoading) {
    return (
      <div className="min-h-screen p-6">
        <div className="container mx-auto max-w-4xl">
          <Skeleton className="h-12 w-48 mb-8" />
          <Skeleton className="h-16 w-full mb-4" />
          <Skeleton className="h-8 w-2/3 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!section) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="relative py-6 px-6">
        <div className="container mx-auto max-w-5xl">
          {/* Back Button */}
          <div className="flex items-center gap-4 mb-6 animate-fade-in">
            <GoldButton
              variant="ghost"
              size="lg"
              onClick={() => navigate('/history')}
              className="flex items-center gap-2"
            >
              <ArrowRight className="h-5 w-5" />
              بازگشت به تاریخچه
            </GoldButton>
          </div>

          {/* Title */}
          <div className="animate-slide-up">
            <h1 className="text-3xl md:text-4xl xl:text-5xl font-bold mb-4">
              <span className="text-gold">{section.title}</span>
            </h1>
            
            {section.highlighted_quote && (
              <GlassCard className="p-6 mb-6">
                <p className="text-xl md:text-2xl text-center italic text-muted-foreground">
                  «{section.highlighted_quote}»
                </p>
              </GlassCard>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-6 pb-12 max-w-5xl">
        {/* Child Sections */}
        {childSections.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
            {childSections.map((child, index) => (
              <button
                key={child.id}
                onClick={() => navigate(`/history/${child.slug}`)}
                className="w-full text-right focus:outline-none group animate-slide-up"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <GlassCard 
                  hover 
                  className="p-4 flex items-center justify-between transition-all group-hover:border-primary/40"
                >
                  <div className="flex-1">
                    <h3 className="text-base md:text-lg font-bold group-hover:text-gold transition-colors">
                      {child.title}
                    </h3>
                  </div>
                  <ChevronLeft className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-all" />
                </GlassCard>
              </button>
            ))}
          </div>
        )}

        {/* Main Content */}
        {section.content && (
          <div className="animate-fade-in mb-8">
            <GlassCard className="p-6 md:p-8">
              <article className="prose prose-lg prose-invert max-w-none">
                <div 
                  className="text-foreground leading-relaxed text-base md:text-lg whitespace-pre-wrap"
                  style={{ lineHeight: '2' }}
                >
                  {section.content}
                </div>
              </article>
            </GlassCard>
          </div>
        )}

        {/* Media Gallery */}
        {media.length > 0 && (
          <div className="animate-fade-in mb-8">
            <h3 className="text-xl font-bold mb-4 text-gold">رسانه‌ها</h3>
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

        {/* Navigation */}
        <nav className="flex items-center justify-between mt-8 gap-4">
          {prevSection ? (
            <GoldButton
              variant="ghost"
              onClick={() => navigate(`/history/${prevSection.slug}`)}
              className="flex items-center gap-2"
            >
              <ArrowRight className="h-5 w-5" />
              {prevSection.title}
            </GoldButton>
          ) : (
            <div />
          )}
          
          {nextSection ? (
            <GoldButton
              variant="ghost"
              onClick={() => navigate(`/history/${nextSection.slug}`)}
              className="flex items-center gap-2"
            >
              {nextSection.title}
              <ArrowLeft className="h-5 w-5" />
            </GoldButton>
          ) : (
            <div />
          )}
        </nav>
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
