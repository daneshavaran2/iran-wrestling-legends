import React from 'react';
import { Users, Trophy, Image, TrendingUp, HardDrive, RefreshCw } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useWrestlers } from '@/contexts/WrestlerContext';
import { useStorageStats } from '@/hooks/useStorageStats';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

export default function AdminDashboardPage() {
  const { wrestlers, achievements, media } = useWrestlers();
  const storageStats = useStorageStats();

  const stats = [
    {
      title: 'تعداد کشتی‌گیرها',
      value: wrestlers.length,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'کشتی آزاد',
      value: wrestlers.filter(w => w.style === 'freestyle').length,
      icon: TrendingUp,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'کشتی فرنگی',
      value: wrestlers.filter(w => w.style === 'greco-roman').length,
      icon: TrendingUp,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
    },
    {
      title: 'تعداد افتخارات',
      value: achievements.length,
      icon: Trophy,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10',
    },
    {
      title: 'تعداد رسانه‌ها',
      value: media.length,
      icon: Image,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
    },
  ];

  const recentWrestlers = wrestlers.slice(-5).reverse();

  // Get compression history for before/after comparison
  const getCompressionHistory = () => {
    try {
      const saved = localStorage.getItem('compression_history');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load compression history:', e);
    }
    return { totalOriginal: 0, totalCompressed: 0, savedBytes: 0, lastUpdated: null };
  };

  const compressionHistory = getCompressionHistory();
  const hasSavings = compressionHistory.savedBytes > 0;

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gold mb-2">داشبورد</h1>
        <p className="text-muted-foreground">
          خوش آمدید به پنل مدیریت موزه کشتی ایران
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <GlassCard 
              key={stat.title} 
              className="p-6 animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Storage Stats & Recent Wrestlers */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Storage Stats Card */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-primary" />
              فضای ذخیره‌سازی
            </h2>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={storageStats.refresh}
              disabled={storageStats.isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${storageStats.isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {storageStats.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-full mb-2" />
                  <div className="h-2 bg-muted/50 rounded w-full" />
                </div>
              ))}
            </div>
          ) : storageStats.error ? (
            <p className="text-destructive text-sm">{storageStats.error}</p>
          ) : (
            <div className="space-y-3">
              {storageStats.buckets.map(bucket => (
                <div key={bucket.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{bucket.displayName}</span>
                    <span className="font-medium">{bucket.sizeMB.toFixed(1)} MB</span>
                  </div>
                  <Progress 
                    value={storageStats.totalSizeMB > 0 
                      ? (bucket.sizeMB / storageStats.totalSizeMB) * 100 
                      : 0
                    } 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {bucket.fileCount} فایل
                  </p>
                </div>
              ))}

              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">مجموع:</span>
                  <span className="text-2xl font-bold text-primary">
                    {storageStats.totalSizeMB.toFixed(1)} MB
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {storageStats.totalFiles} فایل در کل
                </p>
              </div>

              {/* Compression Savings */}
              {hasSavings && (
                <div className="mt-4 p-3 rounded-xl bg-green-500/10 border border-green-500/30">
                  <h4 className="text-sm font-medium text-green-500 mb-2">
                    صرفه‌جویی از فشرده‌سازی
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <div className="font-bold text-muted-foreground">
                        {formatBytes(compressionHistory.totalOriginal)}
                      </div>
                      <div className="text-muted-foreground">قبل</div>
                    </div>
                    <div className="text-lg">→</div>
                    <div>
                      <div className="font-bold text-green-500">
                        {formatBytes(compressionHistory.totalCompressed)}
                      </div>
                      <div className="text-muted-foreground">بعد</div>
                    </div>
                  </div>
                  <div className="text-center mt-2">
                    <span className="text-green-500 font-bold">
                      {Math.round((compressionHistory.savedBytes / compressionHistory.totalOriginal) * 100)}% کاهش
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </GlassCard>

        {/* Recent Wrestlers */}
        <GlassCard className="p-6">
          <h2 className="text-xl font-bold mb-4">آخرین کشتی‌گیرهای اضافه شده</h2>
          {recentWrestlers.length > 0 ? (
            <div className="space-y-3">
              {recentWrestlers.map(wrestler => (
                <div 
                  key={wrestler.id}
                  className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden">
                    {wrestler.image_url ? (
                      <img 
                        src={wrestler.image_url} 
                        alt={wrestler.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Users className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{wrestler.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {wrestler.style === 'freestyle' ? 'آزاد' : 'فرنگی'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              هنوز کشتی‌گیری اضافه نشده است
            </p>
          )}
        </GlassCard>

        {/* Quick Actions */}
        <GlassCard className="p-6">
          <h2 className="text-xl font-bold mb-4">راهنمای سریع</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              ۱. برای افزودن کشتی‌گیر جدید از منوی «کشتی‌گیرها» استفاده کنید.
            </p>
            <p>
              ۲. هر کشتی‌گیر می‌تواند بیوگرافی، افتخارات و رسانه‌های مختلف داشته باشد.
            </p>
            <p>
              ۳. تصاویر و ویدیوها را می‌توانید با Drag & Drop آپلود کنید.
            </p>
            <p>
              ۴. برای فشرده‌سازی تصاویر موجود، به تنظیمات عمومی مراجعه کنید.
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
