import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, ChevronLeft } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GoldButton } from '@/components/ui/GoldButton';
import { useKioskMode } from '@/hooks/useKioskMode';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface HistorySection {
  id: string;
  parent_id: string | null;
  title: string;
  slug: string;
  highlighted_quote: string | null;
  content: string | null;
  display_order: number;
}

export default function HistoryDetailPage() {
  useKioskMode();
  const { slug } = useParams();
  const navigate = useNavigate();
  const [section, setSection] = useState<HistorySection | null>(null);
  const [childSections, setChildSections] = useState<HistorySection[]>([]);
  const [allSections, setAllSections] = useState<HistorySection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      <header className="relative py-8 px-6 2xl:py-12">
        <div className="container mx-auto max-w-4xl">
          {/* Back Button */}
          <div className="flex items-center gap-4 mb-8 animate-fade-in">
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
            <h1 className="text-3xl md:text-4xl xl:text-5xl 2xl:text-6xl font-bold mb-4">
              <span className="text-gold">{section.title}</span>
            </h1>
            
            {section.highlighted_quote && (
              <GlassCard className="p-6 md:p-8 mb-8">
                <p className="text-xl md:text-2xl xl:text-3xl text-center italic text-muted-foreground">
                  «{section.highlighted_quote}»
                </p>
              </GlassCard>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-6 pb-12 max-w-4xl">
        {/* Child Sections (e.g., for کشتی معاصر) */}
        {childSections.length > 0 && (
          <div className="space-y-4 mb-12">
            {childSections.map((child, index) => (
              <button
                key={child.id}
                onClick={() => navigate(`/history/${child.slug}`)}
                className="w-full text-right focus:outline-none group animate-slide-up"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <GlassCard 
                  hover 
                  className="p-6 flex items-center justify-between transition-all group-hover:border-primary/40"
                >
                  <div className="flex-1">
                    <h3 className="text-lg md:text-xl font-bold group-hover:text-gold transition-colors">
                      {child.title}
                    </h3>
                    {child.highlighted_quote && (
                      <p className="text-muted-foreground text-sm italic mt-1">
                        «{child.highlighted_quote}»
                      </p>
                    )}
                  </div>
                  <ChevronLeft className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:-translate-x-2 transition-all" />
                </GlassCard>
              </button>
            ))}
          </div>
        )}

        {/* Main Content */}
        {section.content && (
          <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            <GlassCard className="p-8 md:p-10 xl:p-12">
              <article className="prose prose-lg prose-invert max-w-none">
                <div 
                  className="text-foreground leading-relaxed text-lg md:text-xl whitespace-pre-wrap"
                  style={{ lineHeight: '2' }}
                >
                  {section.content}
                </div>
              </article>
            </GlassCard>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex items-center justify-between mt-12 gap-4">
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
    </div>
  );
}
