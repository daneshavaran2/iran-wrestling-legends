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
    <div className="relative rounded-2xl overflow-hidden mb-6 group">
      <video
        ref={videoRef}
        src={src}
        autoPlay
        muted
        loop
        playsInline
        className="w-full aspect-video object-cover"
        onClick={togglePlay}
      />
      
      {/* Controls Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <button
            onClick={togglePlay}
            className="p-3 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
          >
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
          </button>
          
          <button
            onClick={toggleMute}
            className="p-3 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
          >
            {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Video Title */}
      <div className="absolute top-4 right-4">
        <span className="px-4 py-2 rounded-full bg-black/50 backdrop-blur-sm text-sm font-medium">
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
      {/* Header Section - 40% */}
      <header className="h-[40vh] relative bg-gradient-to-b from-muted/50 to-background flex-shrink-0">
        {/* Back Button */}
        <GoldButton
          variant="ghost"
          size="sm"
          onClick={() => navigate('/wrestlers')}
          className="absolute top-6 right-6 z-10 flex items-center gap-2"
        >
          <ArrowRight className="h-4 w-4" />
          بازگشت
        </GoldButton>

        {/* Centered Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-8 pt-12">
          {/* Wrestler Image - Centered & Large with Animation */}
          <div 
            className="w-24 h-24 md:w-32 md:h-32 xl:w-40 xl:h-40 rounded-full overflow-hidden border-4 border-gold/50 shadow-2xl mb-3 flex-shrink-0 animate-scale-in cursor-pointer hover:scale-105 hover:shadow-gold/30 transition-all duration-300"
            onClick={() => setIsImageModalOpen(true)}
          >
            <img
              src={wrestler.image_url || sampleWrestlerImage}
              alt={wrestler.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Wrestler Name */}
          <h1 className="text-3xl md:text-4xl xl:text-5xl font-bold text-gold text-center mb-3">
            {wrestler.name}
          </h1>
          
          {/* Style & Weight Badges */}
          <div className="flex gap-3 mb-3">
            <span className="glass-card px-4 py-1.5 text-sm font-bold">
              {wrestlingStyles[wrestler.style]}
            </span>
            {wrestler.weight_class && (
              <span className="glass-card px-4 py-1.5 text-sm font-bold">
                {wrestler.weight_class}
              </span>
            )}
          </div>

          {/* Medal Summary */}
          {achievements.length > 0 && (
            <div className="flex gap-2 mb-2">
              {(['gold', 'silver', 'bronze'] as const).map(type => {
                if (medalCounts[type] === 0) return null;
                return (
                  <div 
                    key={type}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-xl',
                      type === 'gold' && 'bg-[hsl(var(--medal-gold-bg))]',
                      type === 'silver' && 'bg-[hsl(var(--medal-silver-bg))]',
                      type === 'bronze' && 'bg-[hsl(var(--medal-bronze-bg))]'
                    )}
                  >
                    <span className="text-lg">{medalEmojis[type]}</span>
                    <span className="font-bold">{medalCounts[type]}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </header>

      {/* Tabs Bar - Fixed with horizontal scroll for mobile */}
      <nav className="flex-shrink-0 border-y border-border/50 bg-background/80 backdrop-blur-lg overflow-x-auto scrollbar-hide">
        <div className="flex justify-start md:justify-center gap-1 p-2 min-w-max">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-4 md:px-6 py-2.5 rounded-xl transition-all duration-200 whitespace-nowrap',
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium text-sm">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Tab Content - 60% with internal scroll */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="container mx-auto max-w-5xl">
          
          {/* Narrative Tab - First Person + Video */}
          {activeTab === 'narrative' && (
            <div className="animate-fade-in">
              {/* Intro Video */}
              {(wrestler as any).intro_video_url ? (
                <IntroVideo 
                  src={(wrestler as any).intro_video_url} 
                  wrestlerName={wrestler.name} 
                />
              ) : (
                <GlassCard className="p-8 mb-6 text-center">
                  <Play className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">ویدیوی معرفی هنوز اضافه نشده است</p>
                </GlassCard>
              )}
              
              {/* First Person Narrative */}
              <GlassCard className="p-8">
                <h2 className="text-2xl font-bold mb-4 text-gold">روایت من</h2>
                {wrestler.bio ? (
                  <p className="text-lg xl:text-xl leading-relaxed whitespace-pre-wrap" style={{ lineHeight: '2' }}>
                    {wrestler.bio}
                  </p>
                ) : (
                  <p className="text-muted-foreground italic">
                    روایت شخصی این کشتی‌گیر هنوز ثبت نشده است.
                  </p>
                )}
              </GlassCard>
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
