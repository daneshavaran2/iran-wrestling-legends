import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Trophy, Image as ImageIcon, BookOpen, User, X, Play, Pause, Volume2, VolumeX, Heart, TrendingUp } from 'lucide-react';
import sampleWrestlerImage from '@/assets/sample-wrestler.jpg';
import { GlassCard } from '@/components/ui/GlassCard';
import { GoldButton } from '@/components/ui/GoldButton';
import { SkeletonProfile } from '@/components/ui/skeleton-cards';
import { EmptyState, ErrorState } from '@/components/ui/StateComponents';
import { MediaGallery } from '@/components/MediaGallery';
import { useWrestlers } from '@/contexts/WrestlerContext';
import { useKioskMode } from '@/hooks/useKioskMode';
import { wrestlingStyles, medalTypes } from '@/data/wrestlers';
import { cn } from '@/lib/utils';

const medalEmojis = {
  gold: '🥇',
  silver: '🥈',
  bronze: '🥉',
};

type TabType = 'narrative' | 'bio' | 'success' | 'achievements' | 'social' | 'media';

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

  return (
    <div className="relative rounded-2xl overflow-hidden group max-h-[35vh] xl:max-h-[40vh]">
      <video
        ref={videoRef}
        src={src}
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-full object-cover"
        style={{ aspectRatio: '16/9', maxHeight: '35vh' }}
        onClick={togglePlay}
      />
      
      {/* Controls Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <button
            onClick={togglePlay}
            className="p-2 rounded-full bg-bronze/30 backdrop-blur-sm hover:bg-bronze/50 transition-colors"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>
          
          <button
            onClick={toggleMute}
            className="p-2 rounded-full bg-bronze/30 backdrop-blur-sm hover:bg-bronze/50 transition-colors"
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Video Title */}
      <div className="absolute top-3 right-3">
        <span className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-xs font-medium">
          روایت {wrestlerName}
        </span>
      </div>
    </div>
  );
}

export default function WrestlerProfilePage() {
  useKioskMode();
  
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getWrestlerById, getAchievementsByWrestlerId, getMediaByWrestlerId, isLoading } = useWrestlers();
  
  const [activeTab, setActiveTab] = useState<TabType>('narrative');
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
          message="کشتی‌گیر مورد نظر یافت نشد" 
          onRetry={() => navigate('/wrestlers')} 
        />
      </div>
    );
  }

  const tabs = [
    { id: 'narrative', label: 'روایت من', icon: User },
    { id: 'bio', label: 'زندگی‌نامه', icon: BookOpen },
    { id: 'success', label: 'مسیر موفقیت', icon: TrendingUp },
    { id: 'achievements', label: 'افتخارات', icon: Trophy },
    { id: 'social', label: 'فعالیت‌های اجتماعی', icon: Heart },
    { id: 'media', label: 'رسانه‌ها', icon: ImageIcon },
  ] as const;

  // Medal counts
  const medalCounts = {
    gold: achievements.filter(a => a.medal_type === 'gold').length,
    silver: achievements.filter(a => a.medal_type === 'silver').length,
    bronze: achievements.filter(a => a.medal_type === 'bronze').length,
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-background">
      {/* Header Section - Compact 30% */}
      <header className="h-[28vh] xl:h-[30vh] relative bg-gradient-to-b from-muted/30 to-background flex-shrink-0">
        {/* Back Button */}
        <GoldButton
          variant="ghost"
          size="sm"
          onClick={() => navigate('/wrestlers')}
          className="absolute top-4 right-4 z-10 flex items-center gap-2"
        >
          <ArrowRight className="h-4 w-4" />
          بازگشت
        </GoldButton>

        {/* Centered Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 pt-8">
          {/* Wrestler Image - Smaller for kiosk */}
          <div 
            className="w-16 h-16 md:w-20 md:h-20 xl:w-24 xl:h-24 rounded-full overflow-hidden border-3 border-bronze/50 shadow-bronze mb-2 flex-shrink-0 animate-scale-in cursor-pointer hover:scale-105 hover:shadow-bronze-lg transition-all duration-300"
            onClick={() => setIsImageModalOpen(true)}
          >
            <img
              src={wrestler.image_url || sampleWrestlerImage}
              alt={wrestler.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Wrestler Name */}
          <h1 className="text-2xl md:text-3xl xl:text-4xl font-bold text-bronze text-center mb-2">
            {wrestler.name}
          </h1>
          
          {/* Style & Weight Badges */}
          <div className="flex gap-2 mb-2">
            <span className="bronze-card px-3 py-1 text-xs font-bold rounded-lg">
              {wrestlingStyles[wrestler.style]}
            </span>
            {wrestler.weight_class && (
              <span className="bronze-card px-3 py-1 text-xs font-bold rounded-lg">
                {wrestler.weight_class}
              </span>
            )}
          </div>

          {/* Medal Summary - Compact */}
          {achievements.length > 0 && (
            <div className="flex gap-1.5">
              {(['gold', 'silver', 'bronze'] as const).map(type => {
                if (medalCounts[type] === 0) return null;
                return (
                  <div 
                    key={type}
                    className={cn(
                      'flex items-center gap-1 px-2 py-1 rounded-lg text-sm',
                      type === 'gold' && 'bg-[hsl(var(--medal-gold-bg))]',
                      type === 'silver' && 'bg-[hsl(var(--medal-silver-bg))]',
                      type === 'bronze' && 'bg-[hsl(var(--medal-bronze-bg))]'
                    )}
                  >
                    <span className="text-base">{medalEmojis[type]}</span>
                    <span className="font-bold text-sm">{medalCounts[type]}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </header>

      {/* Tabs Bar - Compact for kiosk */}
      <nav className="flex-shrink-0 border-y border-bronze/20 bg-background/90 backdrop-blur-lg overflow-x-auto scrollbar-hide">
        <div className="flex justify-center gap-0.5 p-1.5 min-w-max">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1 px-3 md:px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap',
                  activeTab === tab.id
                    ? 'bg-bronze text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-bronze/10'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="font-medium text-xs md:text-sm">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Tab Content - Remaining space with internal scroll */}
      <main className="flex-1 overflow-y-auto p-4 xl:p-5">
        <div className="container mx-auto max-w-5xl">
          
          {/* Narrative Tab - First Person + Video */}
          {activeTab === 'narrative' && (
            <div className="animate-fade-in">
              {/* Two Column Layout for Video + Text */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {/* Intro Video - Constrained Height */}
                <div className="order-1">
                  {(wrestler as any).intro_video_url ? (
                    <IntroVideo 
                      src={(wrestler as any).intro_video_url} 
                      wrestlerName={wrestler.name} 
                    />
                  ) : (
                    <div className="bronze-card rounded-2xl p-6 text-center h-full flex flex-col items-center justify-center min-h-[150px]">
                      <Play className="h-10 w-10 mx-auto mb-2 text-bronze/50" />
                      <p className="text-muted-foreground text-sm">ویدیوی معرفی هنوز اضافه نشده است</p>
                    </div>
                  )}
                </div>
                
                {/* First Person Narrative */}
                <div className="order-2 bronze-card rounded-2xl p-5 xl:p-6 max-h-[35vh] overflow-y-auto">
                  <h2 className="text-xl font-bold mb-3 text-bronze">روایت من</h2>
                  {wrestler.bio ? (
                    <p className="text-sm xl:text-base leading-relaxed whitespace-pre-wrap" style={{ lineHeight: '1.8' }}>
                      {wrestler.bio}
                    </p>
                  ) : (
                    <p className="text-muted-foreground italic text-sm">
                      روایت شخصی این کشتی‌گیر هنوز ثبت نشده است.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Biography Tab */}
          {activeTab === 'bio' && (
            <div className="prose prose-invert max-w-none animate-fade-in">
              {wrestler.full_story ? (
                <GlassCard className="p-8">
                  <div 
                    className="text-lg xl:text-xl leading-relaxed whitespace-pre-wrap"
                    style={{ lineHeight: '2' }}
                  >
                    {wrestler.full_story}
                  </div>
                </GlassCard>
              ) : (
                <EmptyState
                  icon={<BookOpen className="h-16 w-16" />}
                  title="زندگی‌نامه موجود نیست"
                  description="زندگی‌نامه کامل این کشتی‌گیر هنوز ثبت نشده است"
                />
              )}
            </div>
          )}

          {/* Success Path Tab */}
          {activeTab === 'success' && (
            <div className="animate-fade-in">
              {(wrestler as any).success_path ? (
                <GlassCard className="p-8">
                  <h2 className="text-2xl font-bold mb-4 text-gold flex items-center gap-2">
                    <TrendingUp className="h-6 w-6" />
                    مسیر موفقیت
                  </h2>
                  <div 
                    className="text-lg xl:text-xl leading-relaxed whitespace-pre-wrap"
                    style={{ lineHeight: '2' }}
                  >
                    {(wrestler as any).success_path}
                  </div>
                </GlassCard>
              ) : (
                <EmptyState
                  icon={<TrendingUp className="h-16 w-16" />}
                  title="مسیر موفقیت ثبت نشده"
                  description="داستان مسیر موفقیت این کشتی‌گیر هنوز ثبت نشده است"
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
                        achievement.medal_type === 'gold' && 'bg-[hsl(var(--medal-gold-bg))] border-[hsl(var(--medal-gold)/0.3)]',
                        achievement.medal_type === 'silver' && 'bg-[hsl(var(--medal-silver-bg))] border-[hsl(var(--medal-silver)/0.3)]',
                        achievement.medal_type === 'bronze' && 'bg-[hsl(var(--medal-bronze-bg))] border-[hsl(var(--medal-bronze)/0.3)]'
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
                              مدال {medalTypes[achievement.medal_type]}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold mb-1">{achievement.title}</h3>
                          <p className="text-muted-foreground text-sm">{achievement.event}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Trophy className="h-16 w-16" />}
                  title="افتخاراتی ثبت نشده"
                  description="افتخارات این کشتی‌گیر هنوز ثبت نشده است"
                />
              )}
            </div>
          )}

          {/* Social Activities Tab */}
          {activeTab === 'social' && (
            <div className="animate-fade-in">
              {(wrestler as any).social_activities ? (
                <GlassCard className="p-8">
                  <h2 className="text-2xl font-bold mb-4 text-gold flex items-center gap-2">
                    <Heart className="h-6 w-6" />
                    فعالیت‌های اجتماعی
                  </h2>
                  <div 
                    className="text-lg xl:text-xl leading-relaxed whitespace-pre-wrap"
                    style={{ lineHeight: '2' }}
                  >
                    {(wrestler as any).social_activities}
                  </div>
                </GlassCard>
              ) : (
                <EmptyState
                  icon={<Heart className="h-16 w-16" />}
                  title="فعالیت اجتماعی ثبت نشده"
                  description="فعالیت‌های اجتماعی این کشتی‌گیر هنوز ثبت نشده است"
                />
              )}
            </div>
          )}

          {/* Media Tab */}
          {activeTab === 'media' && (
            <div className="animate-fade-in">
              {media.length > 0 ? (
                <MediaGallery items={media} />
              ) : (
                <EmptyState
                  icon={<ImageIcon className="h-16 w-16" />}
                  title="رسانه‌ای موجود نیست"
                  description="تصاویر و ویدیوهای این کشتی‌گیر هنوز ثبت نشده است"
                />
              )}
            </div>
          )}
        </div>
      </main>

      {/* Image Modal */}
      {isImageModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div 
            className="relative max-w-3xl max-h-[90vh] animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setIsImageModalOpen(false)}
              className="absolute -top-12 left-1/2 -translate-x-1/2 text-white/70 hover:text-white transition-colors"
            >
              <X className="h-8 w-8" />
            </button>
            
            <img
              src={wrestler.image_url || sampleWrestlerImage}
              alt={wrestler.name}
              className="w-full h-full object-contain rounded-2xl border-4 border-gold/30 shadow-2xl"
            />
            
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-6 py-2 rounded-full text-gold font-bold">
              {wrestler.name}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
