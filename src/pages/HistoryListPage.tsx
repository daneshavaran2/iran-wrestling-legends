import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, History, ChevronLeft, Sparkles } from 'lucide-react';
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
    <div className="h-screen flex flex-col overflow-hidden p-4 md:p-6 page-enter">
      {/* Header */}
      <header className="flex items-center gap-4 mb-4 shrink-0">
        <GoldButton
          variant="ghost"
          size="lg"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 liquid-button"
        >
          <ArrowRight className="h-5 w-5" />
          بازگشت
        </GoldButton>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-2xl liquid-glass">
            <History className="h-6 w-6 text-bronze" />
          </div>
          <h1 className="text-2xl md:text-3xl xl:text-4xl font-bold">
            <span className="text-bronze bronze-glow">تاریخچه</span>
          </h1>
        </div>
      </header>

      {/* History Sections - Liquid Glass Cards */}
      <main className="flex-1 flex items-center">
        <div className="w-full max-w-7xl mx-auto">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-44 w-full rounded-3xl" />
              ))}
            </div>
          ) : sections.length === 0 ? (
            <div className="liquid-glass p-12 text-center max-w-md mx-auto rounded-3xl">
              <History className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">محتوایی وجود ندارد</h3>
              <p className="text-muted-foreground">
                بخش‌های تاریخچه توسط مدیر اضافه خواهند شد
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
              {sections.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => navigate(`/history/${section.slug}`)}
                  className="w-full text-right focus:outline-none group page-slide-up"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div 
                    className="relative p-5 md:p-6 h-full min-h-[160px] md:min-h-[180px] rounded-3xl
                      liquid-glass
                      flex flex-col justify-between overflow-hidden"
                  >
                    {/* Decorative sparkle */}
                    <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Sparkles className="h-4 w-4 text-bronze animate-pulse" />
                    </div>
                    
                    {/* Content */}
                    <div>
                      <h2 className="text-lg md:text-xl xl:text-2xl font-bold mb-2 text-foreground group-hover:text-bronze transition-colors duration-300">
                        {section.title}
                      </h2>
                      {section.highlighted_quote && (
                        <p className="text-muted-foreground text-xs md:text-sm italic line-clamp-2 opacity-80">
                          «{section.highlighted_quote}»
                        </p>
                      )}
                    </div>
                    
                    {/* Arrow indicator */}
                    <div className="flex justify-start mt-3">
                      <div className="p-2 rounded-full liquid-glass group-hover:border-bronze/30 transition-all duration-300">
                        <ChevronLeft className="h-4 w-4 text-muted-foreground group-hover:text-bronze group-hover:-translate-x-1 transition-all duration-300" />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
