import React, { useState, useMemo } from 'react';
import { Search, Filter } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { SearchInput } from '@/components/ui/GlassInput';
import { GoldButton } from '@/components/ui/GoldButton';
import { WrestlerCard } from '@/components/WrestlerCard';
import { SkeletonCard } from '@/components/ui/skeleton-cards';
import { EmptyState, ErrorState } from '@/components/ui/StateComponents';
import { useWrestlers } from '@/contexts/WrestlerContext';
import { useKioskMode } from '@/hooks/useKioskMode';
import { wrestlingStyles, iranianProvinces } from '@/data/wrestlers';
import { cn } from '@/lib/utils';

export default function HomePage() {
  useKioskMode();
  
  const { wrestlers, isLoading, error } = useWrestlers();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<'all' | 'freestyle' | 'greco-roman'>('all');
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filteredWrestlers = useMemo(() => {
    return wrestlers.filter(wrestler => {
      const matchesSearch = wrestler.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStyle = selectedStyle === 'all' || wrestler.style === selectedStyle;
      const matchesProvince = selectedProvince === 'all' || wrestler.province === selectedProvince;
      return matchesSearch && matchesStyle && matchesProvince;
    });
  }, [wrestlers, searchQuery, selectedStyle, selectedProvince]);

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <header className="relative py-12 px-6">
        <div className="container mx-auto">
          {/* Logo / Title */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              <span className="text-gold">موزه کشتی</span>
              <span className="text-foreground"> ایران</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              مرور زندگی و افتخارات بزرگان کشتی ایران
            </p>
          </div>

          {/* Search Section */}
          <div className="max-w-3xl mx-auto space-y-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <SearchInput
              placeholder="جستجو بر اساس نام کشتی‌گیر..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-lg py-4"
            />

            {/* Filter Toggle */}
            <div className="flex justify-center">
              <GoldButton
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                فیلترها
              </GoldButton>
            </div>

            {/* Filters */}
            {showFilters && (
              <GlassCard className="p-6 animate-scale-in">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Style Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-3 text-muted-foreground">
                      سبک کشتی
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { value: 'all', label: 'همه' },
                        { value: 'freestyle', label: 'آزاد' },
                        { value: 'greco-roman', label: 'فرنگی' },
                      ].map(option => (
                        <button
                          key={option.value}
                          onClick={() => setSelectedStyle(option.value as any)}
                          className={cn(
                            'px-4 py-2 rounded-lg transition-all duration-240',
                            selectedStyle === option.value
                              ? 'bg-primary text-primary-foreground'
                              : 'glass-button'
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Province Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-3 text-muted-foreground">
                      استان
                    </label>
                    <select
                      value={selectedProvince}
                      onChange={(e) => setSelectedProvince(e.target.value)}
                      className="glass-input cursor-pointer"
                    >
                      <option value="all">همه استان‌ها</option>
                      {iranianProvinces.map(province => (
                        <option key={province} value={province}>
                          {province}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </header>

      {/* Wrestlers Grid */}
      <main className="container mx-auto px-6 pb-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">
            کشتی‌گیرها
            <span className="text-muted-foreground text-lg font-normal mr-2">
              ({filteredWrestlers.length} نفر)
            </span>
          </h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredWrestlers.length === 0 ? (
          <EmptyState
            icon={<Search className="h-16 w-16" />}
            title="کشتی‌گیری یافت نشد"
            description="با تغییر فیلترها یا عبارت جستجو، نتایج بیشتری پیدا کنید"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredWrestlers.map((wrestler, index) => (
              <div
                key={wrestler.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <WrestlerCard wrestler={wrestler} />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Admin Link (subtle) */}
      <footer className="fixed bottom-4 left-4">
        <a
          href="/admin/login"
          className="text-xs text-muted-foreground/30 hover:text-muted-foreground transition-colors"
        >
          ورود مدیران
        </a>
      </footer>
    </div>
  );
}
