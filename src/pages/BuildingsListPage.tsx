import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, MapPin } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GoldButton } from '@/components/ui/GoldButton';
import { useKioskMode } from '@/hooks/useKioskMode';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { LazyImage } from '@/components/ui/LazyImage';

interface Building {
  id: string;
  name: string;
  description: string | null;
  hero_image_url: string | null;
  map_link: string | null;
  display_order: number;
}

export default function BuildingsListPage() {
  useKioskMode();
  const navigate = useNavigate();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBuildings();
  }, []);

  const fetchBuildings = async () => {
    try {
      const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setBuildings(data || []);
    } catch (error) {
      console.error('Error fetching buildings:', error);
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
                <span className="text-gold">بناها و اماکن</span>
              </h1>
              <p className="text-muted-foreground text-sm md:text-base mt-1">
                مکان‌های تاریخی و مهم کشتی ایران
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Buildings Grid */}
      <main className="container mx-auto px-6 pb-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-80 w-full rounded-2xl" />
            ))}
          </div>
        ) : buildings.length === 0 ? (
          <GlassCard className="p-12 text-center max-w-2xl mx-auto">
            <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-bold mb-2">محتوایی وجود ندارد</h3>
            <p className="text-muted-foreground">
              بناها و اماکن توسط مدیر اضافه خواهند شد
            </p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {buildings.map((building, index) => (
              <button
                key={building.id}
                onClick={() => navigate(`/buildings/${building.id}`)}
                className="w-full text-right focus:outline-none group animate-scale-in"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <GlassCard 
                  hover 
                  className="overflow-hidden transition-all group-hover:border-primary/40"
                >
                  {/* Image */}
                  <div className="aspect-video bg-muted overflow-hidden">
                    {building.hero_image_url ? (
                      <LazyImage
                        src={building.hero_image_url}
                        alt={building.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="h-16 w-16 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="p-6">
                    <h2 className="text-xl md:text-2xl font-bold mb-2 group-hover:text-gold transition-colors">
                      {building.name}
                    </h2>
                    {building.description && (
                      <p className="text-muted-foreground text-sm line-clamp-2">
                        {building.description}
                      </p>
                    )}
                    {building.map_link && (
                      <div className="flex items-center gap-1 mt-3 text-primary text-sm">
                        <MapPin className="h-4 w-4" />
                        <span>مشاهده روی نقشه</span>
                      </div>
                    )}
                  </div>
                </GlassCard>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
