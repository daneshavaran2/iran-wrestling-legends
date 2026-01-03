import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Trophy, Image as ImageIcon, BookOpen, User, Medal } from 'lucide-react';
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
      <div className="container mx-auto px-6 py-8">
        <SkeletonProfile />
      </div>
    );
  }

  if (!wrestler) {
    return (
      <div className="container mx-auto px-6 py-8">
        <ErrorState 
          message="کشتی‌گیر مورد نظر یافت نشد" 
          onRetry={() => navigate('/')} 
        />
      </div>
    );
  }

  const tabs = [
    { id: 'bio', label: 'بیوگرافی', icon: User },
    { id: 'story', label: 'زندگی‌نامه کامل', icon: BookOpen },
    { id: 'achievements', label: 'افتخارات و مدال‌ها', icon: Trophy },
    { id: 'media', label: 'تصاویر و رسانه‌ها', icon: ImageIcon },
  ] as const;

  return (
    <div className="min-h-screen">
      {/* Sticky Back Button */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-6 py-4">
          <GoldButton
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            بازگشت
          </GoldButton>
        </div>
      </div>

      {/* Profile Header */}
      <header className="container mx-auto px-6 py-8">
        <GlassCard className="p-8 animate-fade-in">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Profile Image */}
            <div className="relative flex-shrink-0">
              <div className="relative">
                <LazyImage
                  src={wrestler.image_url || undefined}
                  alt={wrestler.name}
                  className="w-44 h-52 md:w-52 md:h-64 rounded-2xl shadow-xl"
                />
                <div className="absolute inset-0 rounded-2xl ring-2 ring-primary/20" />
              </div>
              <div className="absolute -bottom-3 -right-3 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-lg">
                {wrestlingStyles[wrestler.style]}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-5">
              <h1 className="text-4xl md:text-5xl font-bold text-gold leading-tight">
                {wrestler.name}
              </h1>
              
              <div className="flex flex-wrap gap-3">
                {wrestler.weight_class && (
                  <span className="glass-card px-4 py-2 text-sm font-medium">
                    ⚖️ {wrestler.weight_class}
                  </span>
                )}
                {wrestler.province && (
                  <span className="glass-card px-4 py-2 text-sm font-medium">
                    📍 {wrestler.province}
                  </span>
                )}
              </div>

              {/* Medal Summary */}
              {achievements.length > 0 && (
                <div className="flex gap-4">
                  {(['gold', 'silver', 'bronze'] as const).map(type => {
                    const count = achievements.filter(a => a.medal_type === type).length;
                    if (count === 0) return null;
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
                        <span className="font-bold text-lg">{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {wrestler.bio && (
                <p className="text-lg text-foreground/80 leading-relaxed max-w-2xl">
                  {wrestler.bio}
                </p>
              )}
            </div>
          </div>
        </GlassCard>
      </header>

      {/* Tabs */}
      <nav className="container mx-auto px-6 mb-6">
        <GlassCard className="p-2 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-6 py-3 rounded-xl whitespace-nowrap transition-all duration-240',
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </GlassCard>
      </nav>

      {/* Tab Content */}
      <main className="container mx-auto px-6 pb-12">
        <GlassCard className="p-8 animate-fade-in min-h-[400px]">
          {activeTab === 'bio' && (
            <div className="prose prose-invert max-w-none">
              {wrestler.bio ? (
                <p className="text-lg leading-relaxed">{wrestler.bio}</p>
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
                  className="text-lg leading-relaxed whitespace-pre-wrap"
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
                <div className="grid md:grid-cols-2 gap-4">
                  {achievements
                    .sort((a, b) => b.year - a.year)
                    .map(achievement => (
                    <div 
                      key={achievement.id} 
                      className={cn(
                        'relative p-6 rounded-2xl border transition-all duration-200 hover:scale-[1.02]',
                        achievement.medal_type === 'gold' && 'bg-[hsl(var(--medal-gold-bg))] border-[hsl(var(--medal-gold)/0.3)]',
                        achievement.medal_type === 'silver' && 'bg-[hsl(var(--medal-silver-bg))] border-[hsl(var(--medal-silver)/0.3)]',
                        achievement.medal_type === 'bronze' && 'bg-[hsl(var(--medal-bronze-bg))] border-[hsl(var(--medal-bronze)/0.3)]'
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div className="text-4xl">
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
                          <h3 className="text-xl font-bold mb-1">{achievement.title}</h3>
                          <p className="text-muted-foreground text-sm">{achievement.event}</p>
                          {achievement.description && (
                            <p className="mt-3 text-foreground/80 text-sm">{achievement.description}</p>
                          )}
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
        </GlassCard>
      </main>
    </div>
  );
}
