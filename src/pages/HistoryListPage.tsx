import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, History, ChevronLeft, Sparkles } from 'lucide-react';
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

  // Color gradients for cards
  const cardColors = [
    'from-amber-500/20 to-orange-600/10',
    'from-emerald-500/20 to-teal-600/10',
    'from-blue-500/20 to-indigo-600/10',
    'from-purple-500/20 to-pink-600/10',
    'from-rose-500/20 to-red-600/10',
    'from-cyan-500/20 to-blue-600/10',
  ];

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
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
            <History className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl xl:text-4xl font-bold">
            <span className="text-gold">تاریخچه</span>
          </h1>
        </div>
      </header>

      {/* History Sections - Modern Cards */}
      <main className="flex-1 flex items-center">
        <div className="w-full max-w-7xl mx-auto">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-44 w-full rounded-2xl" />
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
                  <div 
                    className={`relative p-5 md:p-6 h-full min-h-[160px] md:min-h-[180px] rounded-2xl
                      bg-gradient-to-br ${cardColors[index % cardColors.length]}
                      border border-white/10 backdrop-blur-xl
                      shadow-lg shadow-black/20
                      transition-all duration-500 ease-out
                      group-hover:scale-[1.02] group-hover:shadow-xl group-hover:shadow-primary/20
                      group-hover:border-primary/30
                      flex flex-col justify-between overflow-hidden`}
                  >
                    {/* Decorative sparkle */}
                    <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                    </div>
                    
                    {/* Content */}
                    <div>
                      <h2 className="text-lg md:text-xl xl:text-2xl font-bold mb-2 group-hover:text-gold transition-colors duration-300">
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
                      <div className="p-2 rounded-full bg-white/5 group-hover:bg-primary/20 transition-all duration-300">
                        <ChevronLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:-translate-x-1 transition-all duration-300" />
                      </div>
                    </div>
                    
                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
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
