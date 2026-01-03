import React from 'react';
import { Users, Trophy, Image, TrendingUp } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useWrestlers } from '@/contexts/WrestlerContext';

export default function AdminDashboardPage() {
  const { wrestlers, achievements, media } = useWrestlers();

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

      {/* Recent Wrestlers */}
      <div className="grid lg:grid-cols-2 gap-6">
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
              ۴. اطلاعات ۳۸ کشتی‌گیر اولیه در سیستم ثبت شده که می‌توانید تکمیل کنید.
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
