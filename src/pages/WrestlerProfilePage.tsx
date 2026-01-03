import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Trophy, Image as ImageIcon, BookOpen, User } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GoldButton } from '@/components/ui/GoldButton';
import { LazyImage } from '@/components/ui/LazyImage';
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

type TabType = 'bio' | 'story' | 'achievements' | 'media';

export default function WrestlerProfilePage() {
  useKioskMode();
  
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getWrestlerById, getAchievementsByWrestlerId, getMediaByWrestlerId, isLoading } = useWrestlers();
  
  const [activeTab, setActiveTab] = useState<TabType>('bio');

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
    { id: 'bio', label: 'بیوگرافی', icon: User },
    { id: 'story', label: 'زندگی‌نامه', icon: BookOpen },
    { id: 'achievements', label: 'افتخارات', icon: Trophy },
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
      {/* Compact Header */}
      <header className="flex-shrink-0 px-6 py-3 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <GoldButton
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="flex items-center gap-2"
        >
          <ArrowRight className="h-4 w-4" />
          بازگشت
        </GoldButton>
      </header>

      {/* Main Content - Horizontal Layout */}
      <main className="flex-1 flex gap-6 p-6 overflow-hidden">
        {/* Right Panel - Profile Info */}
        <aside className="w-1/3 flex flex-col gap-4">
          <GlassCard className="p-6 flex-1 flex flex-col">
            {/* Profile Image */}
            <div className="relative flex-shrink-0 mb-4">
              <LazyImage
                src={wrestler.image_url || undefined}
                alt={wrestler.name}
                className="w-full aspect-[3/4] max-h-[45vh] rounded-2xl shadow-xl object-cover"
              />
              <div className="absolute -bottom-2 -right-2 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-lg">
                {wrestlingStyles[wrestler.style]}
              </div>
            </div>

            {/* Name & Info */}
            <h1 className="text-3xl xl:text-4xl font-bold text-gold leading-tight mb-3">
              {wrestler.name}
            </h1>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {wrestler.weight_class && (
                <span className="glass-card px-3 py-1.5 text-sm font-medium">
                  ⚖️ {wrestler.weight_class}
                </span>
              )}
              {wrestler.province && (
                <span className="glass-card px-3 py-1.5 text-sm font-medium">
                  📍 {wrestler.province}
                </span>
              )}
            </div>

            {/* Medal Summary */}
            {achievements.length > 0 && (
              <div className="flex gap-3 mt-auto">
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
          </GlassCard>
        </aside>

        {/* Left Panel - Content Area */}
        <section className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Tab Navigation */}
          <nav className="flex-shrink-0">
            <GlassCard className="p-2">
              <div className="flex gap-2">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-200',
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
            </GlassCard>
          </nav>

          {/* Tab Content */}
          <GlassCard className="flex-1 p-6 overflow-hidden">
            <div className="h-full overflow-y-auto scrollbar-hide">
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
                    <div className="grid grid-cols-2 gap-4">
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
          </GlassCard>
        </section>
      </main>
    </div>
  );
}
