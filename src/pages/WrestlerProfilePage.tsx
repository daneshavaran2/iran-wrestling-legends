import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Trophy, Image as ImageIcon, BookOpen, User } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GoldButton } from '@/components/ui/GoldButton';
import { LazyImage } from '@/components/ui/LazyImage';
import { SkeletonProfile } from '@/components/ui/skeleton-cards';
import { EmptyState, ErrorState } from '@/components/ui/StateComponents';
import { useWrestlers } from '@/contexts/WrestlerContext';
import { useKioskMode } from '@/hooks/useKioskMode';
import { wrestlingStyles, medalTypes } from '@/data/wrestlers';
import { cn } from '@/lib/utils';

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
            <div className="relative">
              <LazyImage
                src={wrestler.image_url || undefined}
                alt={wrestler.name}
                className="w-40 h-48 md:w-48 md:h-56 rounded-2xl shadow-glass"
              />
              <div className="absolute -bottom-2 -right-2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                {wrestlingStyles[wrestler.style]}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-gold">
                {wrestler.name}
              </h1>
              
              <div className="flex flex-wrap gap-4 text-muted-foreground">
                {wrestler.weight_class && (
                  <span className="glass-card px-4 py-2 text-sm">
                    وزن: {wrestler.weight_class}
                  </span>
                )}
                {wrestler.province && (
                  <span className="glass-card px-4 py-2 text-sm">
                    استان: {wrestler.province}
                  </span>
                )}
              </div>

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
                <div className="grid gap-4">
                  {achievements.map(achievement => (
                    <GlassCard key={achievement.id} variant="subtle" className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          'w-12 h-12 rounded-full flex items-center justify-center text-2xl',
                          achievement.medal_type === 'gold' && 'bg-yellow-500/20',
                          achievement.medal_type === 'silver' && 'bg-gray-400/20',
                          achievement.medal_type === 'bronze' && 'bg-orange-600/20'
                        )}>
                          🏅
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold">{achievement.title}</h3>
                          <p className="text-muted-foreground">
                            {achievement.event} - {achievement.year}
                          </p>
                          <span className={cn(
                            'inline-block mt-2 px-3 py-1 rounded-full text-sm',
                            achievement.medal_type === 'gold' && 'bg-yellow-500/20 text-yellow-400',
                            achievement.medal_type === 'silver' && 'bg-gray-400/20 text-gray-300',
                            achievement.medal_type === 'bronze' && 'bg-orange-600/20 text-orange-400'
                          )}>
                            مدال {medalTypes[achievement.medal_type]}
                          </span>
                          {achievement.description && (
                            <p className="mt-3 text-foreground/80">{achievement.description}</p>
                          )}
                        </div>
                      </div>
                    </GlassCard>
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {media.map(item => (
                    <div key={item.id} className="relative group">
                      <LazyImage
                        src={item.type === 'video' ? item.thumbnail || undefined : item.url}
                        alt={item.title || 'رسانه'}
                        className="aspect-square rounded-xl"
                      />
                      {item.type === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full bg-primary/80 flex items-center justify-center">
                            ▶
                          </div>
                        </div>
                      )}
                      {item.title && (
                        <p className="mt-2 text-sm text-muted-foreground truncate">
                          {item.title}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
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
