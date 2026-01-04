import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Trophy, Image as ImageIcon, BookOpen, User, X } from 'lucide-react';
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

type TabType = 'achievements' | 'bio' | 'story' | 'media';

export default function WrestlerProfilePage() {
  useKioskMode();
  
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getWrestlerById, getAchievementsByWrestlerId, getMediaByWrestlerId, isLoading } = useWrestlers();
  
  const [activeTab, setActiveTab] = useState<TabType>('achievements');
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
          onRetry={() => navigate('/')} 
        />
      </div>
    );
  }

  const tabs = [
    { id: 'achievements', label: 'افتخارات', icon: Trophy },
    { id: 'bio', label: 'بیوگرافی', icon: User },
    { id: 'story', label: 'زندگی‌نامه', icon: BookOpen },
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
      {/* Header Section - 45% */}
      <header className="h-[45vh] relative bg-gradient-to-b from-muted/50 to-background flex-shrink-0">
        {/* Back Button */}
        <GoldButton
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="absolute top-6 right-6 z-10 flex items-center gap-2"
        >
          <ArrowRight className="h-4 w-4" />
          بازگشت
        </GoldButton>

        {/* Centered Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-8 pt-12">
          {/* Wrestler Image - Centered & Large with Animation */}
          <div 
            className="w-28 h-28 md:w-36 md:h-36 xl:w-44 xl:h-44 rounded-full overflow-hidden border-4 border-gold/50 shadow-2xl mb-4 flex-shrink-0 animate-scale-in cursor-pointer hover:scale-105 hover:shadow-gold/30 transition-all duration-300"
            onClick={() => setIsImageModalOpen(true)}
          >
            <img
              src={wrestler.image_url || sampleWrestlerImage}
              alt={wrestler.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Wrestler Name */}
          <h1 className="text-4xl md:text-5xl xl:text-6xl font-bold text-gold text-center mb-4">
            {wrestler.name}
          </h1>
          
          {/* Style & Weight Badges */}
          <div className="flex gap-3 mb-4">
            <span className="glass-card px-5 py-2 text-base font-bold">
              {wrestlingStyles[wrestler.style]}
            </span>
            {wrestler.weight_class && (
              <span className="glass-card px-5 py-2 text-base font-bold">
                {wrestler.weight_class}
              </span>
            )}
          </div>

          {/* Medal Summary */}
          {achievements.length > 0 && (
            <div className="flex gap-3 mb-4">
              {(['gold', 'silver', 'bronze'] as const).map(type => {
                if (medalCounts[type] === 0) return null;
                return (
                  <div 
                    key={type}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-xl',
                      type === 'gold' && 'bg-[hsl(var(--medal-gold-bg))]',
                      type === 'silver' && 'bg-[hsl(var(--medal-silver-bg))]',
                      type === 'bronze' && 'bg-[hsl(var(--medal-bronze-bg))]'
                    )}
                  >
                    <span className="text-xl">{medalEmojis[type]}</span>
                    <span className="font-bold text-lg">{medalCounts[type]}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Province */}
          {wrestler.province && (
            <GlassCard className="px-4 py-2">
              <span className="text-muted-foreground text-xs">استان</span>
              <p className="font-bold text-base">{wrestler.province}</p>
            </GlassCard>
          )}
        </div>

        {/* Bio Summary - Bottom Center */}
        {wrestler.bio && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-2xl px-8">
            <p className="text-center text-muted-foreground text-sm line-clamp-2">
              {wrestler.bio}
            </p>
          </div>
        )}
      </header>

      {/* Tabs Bar - Fixed */}
      <nav className="flex-shrink-0 border-y border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="flex justify-center gap-2 p-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-8 py-3 rounded-xl transition-all duration-200',
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Tab Content - 55% with internal scroll */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="container mx-auto max-w-5xl">
          {activeTab === 'bio' && (
            <div className="prose prose-invert max-w-none">
              {wrestler.bio ? (
                <p className="text-lg xl:text-xl leading-relaxed">{wrestler.bio}</p>
              ) : (
                <EmptyState
                  icon={<User className="h-16 w-16" />}
                  title="بیوگرافی موجود نیست"
                  description="بیوگرافی این کشتی‌گیر هنوز ثبت نشده است"
                />
              )}
            </div>
          )}

          {activeTab === 'story' && (
            <div className="prose prose-invert max-w-none">
              {wrestler.full_story ? (
                <div 
                  className="text-lg xl:text-xl leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: wrestler.full_story }}
                />
              ) : (
                <EmptyState
                  icon={<BookOpen className="h-16 w-16" />}
                  title="زندگی‌نامه موجود نیست"
                  description="زندگی‌نامه کامل این کشتی‌گیر هنوز ثبت نشده است"
                />
              )}
            </div>
          )}

          {activeTab === 'achievements' && (
            <div>
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

          {activeTab === 'media' && (
            <div>
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
            {/* Close Button */}
            <button
              onClick={() => setIsImageModalOpen(false)}
              className="absolute -top-12 left-1/2 -translate-x-1/2 text-white/70 hover:text-white transition-colors"
            >
              <X className="h-8 w-8" />
            </button>
            
            {/* Large Image */}
            <img
              src={wrestler.image_url || sampleWrestlerImage}
              alt={wrestler.name}
              className="w-full h-full object-contain rounded-2xl border-4 border-gold/30 shadow-2xl"
            />
            
            {/* Wrestler Name */}
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-6 py-2 rounded-full text-gold font-bold">
              {wrestler.name}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
