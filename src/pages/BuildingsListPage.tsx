import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, MapPin, ExternalLink } from 'lucide-react';
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
        <div className="flex items-center gap-3 page-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="p-2 rounded-2xl liquid-glass">
            <Building2 className="h-6 w-6 text-bronze" />
          </div>
          <h1 className="text-2xl md:text-3xl xl:text-4xl font-bold">
            <span className="text-bronze bronze-glow">بناها و اماکن</span>
          </h1>
        </div>
      </header>

      {/* Buildings Grid */}
      <main className="flex-1 flex items-center overflow-hidden">
        <div className="w-full max-w-7xl mx-auto">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-56 w-full rounded-3xl" />
              ))}
            </div>
          ) : buildings.length === 0 ? (
            <div className="liquid-glass p-12 text-center max-w-md mx-auto rounded-3xl">
              <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">محتوایی وجود ندارد</h3>
              <p className="text-muted-foreground">
                بناها و اماکن توسط مدیر اضافه خواهند شد
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {buildings.map((building, index) => (
                <button
                  key={building.id}
                  onClick={() => navigate(`/buildings/${building.id}`)}
                  className="w-full text-right focus:outline-none group page-slide-up"
                  style={{ animationDelay: `${0.1 + index * 0.08}s` }}
                >
                  <div className="relative overflow-hidden rounded-3xl liquid-glass">
                    {/* Image with zoom effect */}
                    <div className="aspect-[4/3] bg-muted overflow-hidden relative">
                      {building.hero_image_url ? (
                        <LazyImage
                          src={building.hero_image_url}
                          alt={building.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-bronze/10 to-transparent">
                          <Building2 className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                      )}
                      
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                      
                      {/* Map badge */}
                      {building.map_link && (
                        <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full gold-button text-xs flex items-center gap-1.5 shadow-lg">
                          <MapPin className="h-3 w-3" />
                          <span>نقشه</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="p-4 relative">
                      <h2 className="text-base md:text-lg font-bold mb-1 group-hover:text-bronze transition-colors duration-300 line-clamp-1">
                        {building.name}
                      </h2>
                      {building.description && (
                        <p className="text-muted-foreground text-xs line-clamp-2 opacity-70">
                          {building.description}
                        </p>
                      )}
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
