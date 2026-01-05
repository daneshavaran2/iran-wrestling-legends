import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, History, ChevronLeft } from 'lucide-react';
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
  display_order: number;
}

export default function HistoryListPage() {
  useKioskMode();
  const navigate = useNavigate();
  const [sections, setSections] = useState<HistorySection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const { data, error } = await supabase
        .from('history_sections')
        .select('*')
        .is('parent_id', null)
        .order('display_order');

      if (error) throw error;
      setSections(data || []);
    } catch (error) {
      console.error('Error fetching history sections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden p-4 md:p-6">
      {/* Header */}
      <header className="flex items-center gap-4 mb-4 animate-fade-in shrink-0">
        <GoldButton
          variant="ghost"
          size="lg"
          onClick={() => navigate('/')}
          className="flex items-center gap-2"
        >
          <ArrowRight className="h-5 w-5" />
          بازگشت
        </GoldButton>
        <div>
          <h1 className="text-2xl md:text-3xl xl:text-4xl font-bold">
            <span className="text-gold">تاریخچه</span>
          </h1>
        </div>
      </header>

      {/* History Sections - Horizontal Scroll or Grid */}
      <main className="flex-1 flex items-center">
        <div className="w-full max-w-7xl mx-auto">
          {isLoading ? (
            <div className="grid grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-40 w-full rounded-2xl" />
              ))}
            </div>
          ) : sections.length === 0 ? (
            <GlassCard className="p-12 text-center max-w-md mx-auto">
              <History className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">محتوایی وجود ندارد</h3>
              <p className="text-muted-foreground">
                بخش‌های تاریخچه توسط مدیر اضافه خواهند شد
              </p>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
              {sections.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => navigate(`/history/${section.slug}`)}
                  className="w-full text-right focus:outline-none group animate-scale-in"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <GlassCard 
                    hover 
                    className="p-4 md:p-6 h-full flex flex-col justify-center min-h-[140px] md:min-h-[180px] transition-all group-hover:border-primary/40"
                  >
                    <h2 className="text-lg md:text-xl xl:text-2xl font-bold mb-2 group-hover:text-gold transition-colors">
                      {section.title}
                    </h2>
                    {section.highlighted_quote && (
                      <p className="text-muted-foreground text-xs md:text-sm italic line-clamp-2">
                        «{section.highlighted_quote}»
                      </p>
                    )}
                    <ChevronLeft className="h-5 w-5 text-muted-foreground mt-auto group-hover:text-primary group-hover:-translate-x-1 transition-all" />
                  </GlassCard>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
