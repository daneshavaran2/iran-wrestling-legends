import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, WifiOff } from 'lucide-react';
import { GoldButton } from '@/components/ui/GoldButton';
import { ParallaxCard } from '@/components/ui/ParallaxCard';
import { SparkParticles } from '@/components/ui/SparkParticles';
import { useKioskMode } from '@/hooks/useKioskMode';
import { useLanguage } from '@/contexts/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';
import { LazyImage } from '@/components/ui/LazyImage';
import { useOfflineData } from '@/contexts/OfflineDataContext';
import { TranslatedContent } from '@/components/TranslatedContent';

export default function BuildingsListPage() {
  useKioskMode();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { buildings, isLoadingBuildings, isOffline } = useOfflineData();

  return (
    <div className="h-screen flex flex-col overflow-hidden p-4 md:p-6 page-enter relative">
      {/* Spark Particles */}
      <SparkParticles count={25} />

      {/* Header */}
      <header className="flex items-center gap-4 mb-4 shrink-0 relative z-10">
        <GoldButton
          variant="ghost"
          size="lg"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 cyber-button"
        >
          <ArrowRight className="h-5 w-5" />
          {t('common.back')}
        </GoldButton>
        <div className="flex items-center gap-3 page-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="p-2 rounded-2xl cyber-glass border border-primary/30">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl xl:text-4xl font-bold">
            <span className="text-neon neon-glow">{t('buildings.title')}</span>
          </h1>
          {isOffline && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-500/20 text-yellow-500 text-xs">
              <WifiOff className="h-3 w-3" />
              <span>{t('common.offline')}</span>
            </div>
          )}
        </div>
      </header>

      {/* Buildings Grid */}
      <main className="flex-1 flex items-center overflow-hidden relative z-10">
        <div className="w-full max-w-7xl mx-auto">
          {isLoadingBuildings ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-56 w-full rounded-3xl" />
              ))}
            </div>
          ) : buildings.length === 0 ? (
            <div className="cyber-glass p-12 text-center max-w-md mx-auto rounded-3xl border border-primary/30">
              <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">{t('buildings.noContent')}</h3>
              <p className="text-muted-foreground">
                {t('buildings.noContentDesc')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {buildings.map((building, index) => (
                <ParallaxCard
                  key={building.id}
                  onClick={() => navigate(`/buildings/${building.id}`)}
                  intensity={8}
                  className="w-full text-right focus:outline-none page-slide-up"
                >
                  <div 
                    className="relative overflow-hidden rounded-3xl cyber-glass cyber-hud group"
                    style={{ animationDelay: `${0.1 + index * 0.08}s` }}
                  >
                    {/* Image with zoom effect */}
                    <div className="aspect-[4/3] bg-muted overflow-hidden relative">
                      {building.hero_image_url ? (
                        <LazyImage
                          src={building.hero_image_url}
                          alt={building.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-transparent">
                          <Building2 className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                      )}
                      
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                    </div>
                    
                    {/* Content */}
                    <div className="p-4 relative">
                      <h2 className="text-base md:text-lg font-bold mb-1 group-hover:text-primary transition-colors duration-300 line-clamp-1">
                        <TranslatedContent text={building.name} />
                      </h2>
                      {building.description && (
                        <p className="text-muted-foreground text-xs line-clamp-2 opacity-70">
                          <TranslatedContent text={building.description} />
                        </p>
                      )}
                    </div>
                  </div>
                </ParallaxCard>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
