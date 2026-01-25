import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Trophy, Image as ImageIcon, BookOpen, X, Play, Pause, Volume2, VolumeX, Heart, TrendingUp } from 'lucide-react';
import sampleWrestlerImage from '@/assets/sample-wrestler.jpg';
import { GlassCard } from '@/components/ui/GlassCard';
import { GoldButton } from '@/components/ui/GoldButton';
import { SkeletonProfile } from '@/components/ui/skeleton-cards';
import { EmptyState, ErrorState } from '@/components/ui/StateComponents';
import { MediaGallery } from '@/components/MediaGallery';
import { SparkParticles } from '@/components/ui/SparkParticles';
import { TranslatedContent } from '@/components/TranslatedContent';
import { useWrestlers } from '@/contexts/WrestlerContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useKioskMode } from '@/hooks/useKioskMode';
import { wrestlingStyles, medalTypes } from '@/data/wrestlers';
import { cn } from '@/lib/utils';

const medalEmojis = {
  gold: '🥇',
  silver: '🥈',
  bronze: '🥉',
};

type TabType = 'intro' | 'bio' | 'success' | 'achievements' | 'social' | 'media';

// Intro Video Component with autoplay muted and tap-to-play sound
function IntroVideo({ src, wrestlerName }: { src: string; wrestlerName: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Pause on scroll
    const handleScroll = () => {
      const rect = video.getBoundingClientRect();
      const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
      if (!isVisible && !video.paused) {
        video.pause();
        setIsPlaying(false);
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const { t } = useLanguage();

  return (
    <div className="relative rounded-3xl overflow-hidden group cyber-glass cyber-hud">
      <div className="aspect-video w-full">
        <video
          ref={videoRef}
          src={src}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-contain bg-black/50"
          onClick={togglePlay}
        />
      </div>
      
      {/* Controls Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <button
            onClick={togglePlay}
            className="p-3 xl:p-4 rounded-full cyber-glass hover:bg-primary/30 transition-colors"
          >
            {isPlaying ? <Pause className="h-6 w-6 xl:h-7 xl:w-7" /> : <Play className="h-6 w-6 xl:h-7 xl:w-7" />}
          </button>
          
          <button
            onClick={toggleMute}
            className="p-3 xl:p-4 rounded-full cyber-glass hover:bg-primary/30 transition-colors"
          >
            {isMuted ? <VolumeX className="h-6 w-6 xl:h-7 xl:w-7" /> : <Volume2 className="h-6 w-6 xl:h-7 xl:w-7" />}
          </button>
        </div>
      </div>

      {/* Video Title */}
      <div className="absolute top-4 right-4">
        <span className="px-4 py-2 rounded-full cyber-glass text-sm xl:text-base font-medium">
          {t('profile.tabs.intro')}
        </span>
      </div>
    </div>
  );
}

export default function WrestlerProfilePage() {
  useKioskMode();
  
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, dir } = useLanguage();
  const { getWrestlerById, getAchievementsByWrestlerId, getMediaByWrestlerId, isLoading } = useWrestlers();
  
  const [activeTab, setActiveTab] = useState<TabType>('intro');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const wrestler = getWrestlerById(id || '');
  const achievements = getAchievementsByWrestlerId(id || '');
  const media = getMediaByWrestlerId(id || '');

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center p-8">
        <SkeletonProfile />
      </div>
    );
  }

  if (!wrestler) {
    return (
      <div className="h-screen flex items-center justify-center p-8">
        <ErrorState 
          message={t('profile.labels.notFound')} 
          onRetry={() => navigate('/wrestlers')} 
        />
      </div>
    );
  }

  const tabs = [
    { id: 'intro', label: t('profile.tabs.intro'), icon: Play },
    { id: 'bio', label: t('profile.tabs.bio'), icon: BookOpen },
    { id: 'success', label: t('profile.tabs.success'), icon: TrendingUp },
    { id: 'achievements', label: t('profile.tabs.achievements'), icon: Trophy },
    { id: 'social', label: t('profile.tabs.social'), icon: Heart },
    { id: 'media', label: t('profile.tabs.media'), icon: ImageIcon },
  ] as const;

  // Medal counts
  const medalCounts = {
    gold: achievements.filter(a => a.medal_type === 'gold').length,
    silver: achievements.filter(a => a.medal_type === 'silver').length,
    bronze: achievements.filter(a => a.medal_type === 'bronze').length,
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-background relative">
      {/* Spark Particles */}
      <SparkParticles count={20} />

      {/* Header Section - Compact for Kiosk */}
      <header className="py-4 xl:py-6 relative bg-gradient-to-b from-muted/30 to-background flex-shrink-0 z-10">
        {/* Back Button */}
        <GoldButton
          variant="ghost"
          size="md"
          onClick={() => navigate('/wrestlers')}
          className="absolute top-4 right-4 z-10 flex items-center gap-2"
        >
          <ArrowRight className={`h-5 w-5 xl:h-6 xl:w-6 ${dir === 'ltr' ? 'rotate-180' : ''}`} />
          <span className="text-base xl:text-lg">{t('profile.labels.back')}</span>
        </GoldButton>

        {/* Centered Content - Horizontal Layout */}
        <div className="flex items-center justify-center gap-6 xl:gap-8 px-6 pt-12 xl:pt-14">
          {/* Wrestler Image */}
          <div 
            className="w-20 h-20 md:w-24 md:h-24 xl:w-32 xl:h-32 2xl:w-36 2xl:h-36 rounded-full overflow-hidden border-4 border-primary/50 shadow-[0_0_30px_hsl(20_100%_50%/0.3)] flex-shrink-0 animate-scale-in cursor-pointer hover:scale-105 hover:shadow-[0_0_50px_hsl(20_100%_50%/0.5)] transition-all duration-300"
            onClick={() => setIsImageModalOpen(true)}
          >
            <img
              src={wrestler.image_url || sampleWrestlerImage}
              alt={wrestler.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Info Section */}
          <div className="flex flex-col items-start">
            {/* Wrestler Name */}
            <h1 className="text-2xl md:text-3xl xl:text-4xl 2xl:text-5xl font-bold text-neon neon-glow mb-2 xl:mb-3">
              <TranslatedContent text={wrestler.name} />
            </h1>
            
            {/* Style & Weight Badges */}
            <div className="flex gap-2 xl:gap-3 mb-2 xl:mb-3">
              <span className="cyber-glass px-4 py-2 text-sm xl:text-base font-bold rounded-xl border border-primary/30">
                {t(`wrestler.${wrestler.style === 'freestyle' ? 'freestyle' : 'grecoRoman'}`)}
              </span>
              {wrestler.weight_class && (
                <span className="cyber-glass px-4 py-2 text-sm xl:text-base font-bold rounded-xl border border-primary/30">
                  {wrestler.weight_class}
                </span>
              )}
            </div>

            {/* Medal Summary */}
            {achievements.length > 0 && (
              <div className="flex gap-2 xl:gap-3">
                {(['gold', 'silver', 'bronze'] as const).map(type => {
                  if (medalCounts[type] === 0) return null;
                  return (
                    <div 
                      key={type}
                      className={cn(
                        'flex items-center gap-2 px-3 xl:px-4 py-2 rounded-xl text-base xl:text-lg border',
                        type === 'gold' && 'bg-[hsl(var(--medal-gold-bg))] border-[hsl(var(--medal-gold)/0.5)] shadow-[0_0_20px_hsl(43_100%_55%/0.3)]',
                        type === 'silver' && 'bg-[hsl(var(--medal-silver-bg))] border-[hsl(var(--medal-silver)/0.3)]',
                        type === 'bronze' && 'bg-[hsl(var(--medal-bronze-bg))] border-[hsl(var(--medal-bronze)/0.5)] shadow-[0_0_20px_hsl(25_70%_50%/0.3)]'
                      )}
                    >
                      <span className="text-xl xl:text-2xl">{medalEmojis[type]}</span>
                      <span className="font-bold">{medalCounts[type]}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Tabs Bar - Optimized for Kiosk Touch */}
      <nav className="flex-shrink-0 border-y border-primary/20 bg-background/90 backdrop-blur-lg overflow-x-auto scrollbar-hide z-10">
        <div className="flex justify-center gap-2 xl:gap-3 p-3 xl:p-4 min-w-max">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 xl:gap-3 px-5 xl:px-6 py-3 xl:py-4 rounded-2xl transition-all duration-200 whitespace-nowrap',
                  activeTab === tab.id
                    ? 'cyber-button'
                    : 'cyber-glass text-muted-foreground hover:text-foreground hover:border-primary/40'
                )}
              >
                <Icon className="h-5 w-5 xl:h-6 xl:w-6" />
                <span className="font-medium text-sm xl:text-base">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Tab Content - Remaining space with internal scroll */}
      <main className="flex-1 overflow-y-auto p-4 xl:p-6 2xl:p-8 relative z-10">
        <div className="container mx-auto max-w-6xl 2xl:max-w-7xl">

          {/* Intro Clip Tab */}
          {activeTab === 'intro' && (
            <div className="animate-fade-in">
              {(wrestler as any).intro_video_url ? (
                <div className="w-full max-w-4xl mx-auto">
                  <IntroVideo 
                    src={(wrestler as any).intro_video_url} 
                    wrestlerName={wrestler.name} 
                  />
                </div>
              ) : (
                <EmptyState
                  icon={<Play className="h-16 w-16" />}
                  title={t('profile.empty.noIntro')}
                  description=""
                />
              )}
            </div>
          )}

          {/* Biography Tab */}
          {activeTab === 'bio' && (
            <div className="animate-fade-in">
              {wrestler.full_story ? (
                <div className="cyber-glass p-8 rounded-3xl">
                  <div 
                    className="text-lg xl:text-xl leading-relaxed whitespace-pre-wrap"
                    style={{ lineHeight: '2' }}
                  >
                    <TranslatedContent text={wrestler.full_story} />
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={<BookOpen className="h-16 w-16" />}
                  title={t('profile.empty.noBio')}
                  description=""
                />
              )}
            </div>
          )}

          {/* Success Path Tab */}
          {activeTab === 'success' && (
            <div className="animate-fade-in">
              {(wrestler as any).success_path ? (
                <div className="cyber-glass p-8 rounded-3xl">
                  <h2 className="text-2xl font-bold mb-4 text-neon flex items-center gap-2">
                    <TrendingUp className="h-6 w-6" />
                    {t('profile.tabs.success')}
                  </h2>
                  <div 
                    className="text-lg xl:text-xl leading-relaxed whitespace-pre-wrap"
                    style={{ lineHeight: '2' }}
                  >
                    <TranslatedContent text={(wrestler as any).success_path} />
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={<TrendingUp className="h-16 w-16" />}
                  title={t('profile.empty.noSuccess')}
                  description=""
                />
              )}
            </div>
          )}

          {/* Achievements Tab */}
          {activeTab === 'achievements' && (
            <div className="animate-fade-in">
              {achievements.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {achievements
                    .sort((a, b) => b.year - a.year)
                    .map(achievement => (
                    <div 
                      key={achievement.id} 
                      className={cn(
                        'relative p-5 rounded-2xl border transition-all duration-200 hover:scale-[1.02]',
                        achievement.medal_type === 'gold' && 'bg-[hsl(var(--medal-gold-bg))] border-[hsl(var(--medal-gold)/0.4)] shadow-[0_0_30px_hsl(43_100%_55%/0.2)]',
                        achievement.medal_type === 'silver' && 'bg-[hsl(var(--medal-silver-bg))] border-[hsl(var(--medal-silver)/0.3)]',
                        achievement.medal_type === 'bronze' && 'bg-[hsl(var(--medal-bronze-bg))] border-[hsl(var(--medal-bronze)/0.4)] shadow-[0_0_30px_hsl(25_70%_50%/0.2)]'
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div className="text-3xl">
                          {medalEmojis[achievement.medal_type]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={cn(
                              'px-3 py-1 rounded-full text-xs font-bold',
                              achievement.medal_type === 'gold' && 'bg-[hsl(var(--medal-gold)/0.3)] text-[hsl(var(--medal-gold))]',
                              achievement.medal_type === 'silver' && 'bg-[hsl(var(--medal-silver)/0.3)] text-[hsl(var(--medal-silver))]',
                              achievement.medal_type === 'bronze' && 'bg-[hsl(var(--medal-bronze)/0.3)] text-[hsl(var(--medal-bronze))]'
                            )}>
                              {achievement.year}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {t(`profile.medal.${achievement.medal_type}`)}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold mb-1">
                            <TranslatedContent text={achievement.title} />
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            <TranslatedContent text={achievement.event} />
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Trophy className="h-16 w-16" />}
                  title={t('profile.empty.noAchievements')}
                  description=""
                />
              )}
            </div>
          )}

          {/* Social Activities Tab */}
          {activeTab === 'social' && (
            <div className="animate-fade-in">
              {(wrestler as any).social_activities ? (
                <div className="cyber-glass p-8 rounded-3xl">
                  <h2 className="text-2xl font-bold mb-4 text-neon flex items-center gap-2">
                    <Heart className="h-6 w-6" />
                    {t('profile.tabs.social')}
                  </h2>
                  <div 
                    className="text-lg xl:text-xl leading-relaxed whitespace-pre-wrap"
                    style={{ lineHeight: '2' }}
                  >
                    <TranslatedContent text={(wrestler as any).social_activities} />
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={<Heart className="h-16 w-16" />}
                  title={t('profile.empty.noSocial')}
                  description=""
                />
              )}
            </div>
          )}

          {activeTab === 'media' && (
            <div className="animate-fade-in">
              {media.length > 0 ? (
                <MediaGallery items={media.map(m => ({ id: m.id, type: m.type, url: m.url, thumbnail: m.thumbnail, title: m.title }))} />
              ) : (
                <EmptyState
                  icon={<ImageIcon className="h-16 w-16" />}
                  title={t('profile.empty.noMedia')}
                  description=""
                />
              )}
            </div>
          )}
        </div>
      </main>

      {/* Image Modal */}
      {isImageModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-lg animate-fade-in"
          onClick={() => setIsImageModalOpen(false)}
        >
          <button
            className="absolute top-6 right-6 p-3 cyber-glass rounded-full hover:bg-primary/30"
            onClick={() => setIsImageModalOpen(false)}
          >
            <X className="h-8 w-8" />
          </button>
          <img
            src={wrestler.image_url || sampleWrestlerImage}
            alt={wrestler.name}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-3xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
