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
            <span className="text-gold">بناها و اماکن</span>
          </h1>
        </div>
      </header>

      {/* Buildings Grid */}
      <main className="flex-1 flex items-center overflow-hidden">
        <div className="w-full max-w-7xl mx-auto">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-48 w-full rounded-2xl" />
              ))}
            </div>
          ) : buildings.length === 0 ? (
            <GlassCard className="p-12 text-center max-w-md mx-auto">
              <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">محتوایی وجود ندارد</h3>
              <p className="text-muted-foreground">
                بناها و اماکن توسط مدیر اضافه خواهند شد
              </p>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {buildings.map((building, index) => (
                <button
                  key={building.id}
                  onClick={() => navigate(`/buildings/${building.id}`)}
                  className="w-full text-right focus:outline-none group animate-scale-in"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <GlassCard 
                    hover 
                    className="overflow-hidden transition-all group-hover:border-primary/40"
                  >
                    {/* Image */}
                    <div className="aspect-[4/3] bg-muted overflow-hidden">
                      {building.hero_image_url ? (
                        <LazyImage
                          src={building.hero_image_url}
                          alt={building.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="p-3 md:p-4">
                      <h2 className="text-base md:text-lg font-bold mb-1 group-hover:text-gold transition-colors line-clamp-1">
                        {building.name}
                      </h2>
                      {building.map_link && (
                        <div className="flex items-center gap-1 text-primary text-xs">
                          <MapPin className="h-3 w-3" />
                          <span>نقشه</span>
                        </div>
                      )}
                    </div>
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
