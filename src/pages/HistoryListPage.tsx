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

// Initial seed data for history sections
const defaultHistorySections: Omit<HistorySection, 'id'>[] = [
  { parent_id: null, title: 'چراییِ کشتی', slug: 'why-wrestling', highlighted_quote: 'کشتی، مادر همه ورزش‌هاست', display_order: 1 },
  { parent_id: null, title: 'ریشه‌شناسی کشتی', slug: 'etymology', highlighted_quote: 'از پهلوانی تا قهرمانی', display_order: 2 },
  { parent_id: null, title: 'روایات دینی و اساطیری', slug: 'mythology', highlighted_quote: 'رستم، نماد پهلوانی ایرانی', display_order: 3 },
  { parent_id: null, title: 'کشتی پهلوانی', slug: 'pahlavani', highlighted_quote: 'سنت زورخانه‌ای', display_order: 4 },
  { parent_id: null, title: 'کشتی معاصر', slug: 'contemporary', highlighted_quote: 'از المپیک برلین تا امروز', display_order: 5 },
];

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
    <div className="min-h-screen">
      {/* Header */}
      <header className="relative py-8 px-6 2xl:py-12">
        <div className="container mx-auto">
          {/* Back Button & Title */}
          <div className="flex items-center gap-4 mb-8 animate-fade-in">
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
              <h1 className="text-3xl md:text-4xl xl:text-5xl font-bold">
                <span className="text-gold">تاریخچه</span>
              </h1>
              <p className="text-muted-foreground text-sm md:text-base mt-1">
                سفر در تاریخ کشتی ایران
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* History Sections */}
      <main className="container mx-auto px-6 pb-12">
        <div className="max-w-4xl mx-auto space-y-4">
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl" />
            ))
          ) : sections.length === 0 ? (
            <GlassCard className="p-12 text-center">
              <History className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">محتوایی وجود ندارد</h3>
              <p className="text-muted-foreground">
                بخش‌های تاریخچه توسط مدیر اضافه خواهند شد
              </p>
            </GlassCard>
          ) : (
            sections.map((section, index) => (
              <button
                key={section.id}
                onClick={() => navigate(`/history/${section.slug}`)}
                className="w-full text-right focus:outline-none group animate-slide-up"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <GlassCard 
                  hover 
                  className="p-6 md:p-8 flex items-center justify-between transition-all group-hover:border-primary/40"
                >
                  <div className="flex-1">
                    <h2 className="text-xl md:text-2xl xl:text-3xl font-bold mb-2 group-hover:text-gold transition-colors">
                      {section.title}
                    </h2>
                    {section.highlighted_quote && (
                      <p className="text-muted-foreground text-sm md:text-base italic">
                        «{section.highlighted_quote}»
                      </p>
                    )}
                  </div>
                  <ChevronLeft className="h-6 w-6 text-muted-foreground group-hover:text-primary group-hover:-translate-x-2 transition-all" />
                </GlassCard>
              </button>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
