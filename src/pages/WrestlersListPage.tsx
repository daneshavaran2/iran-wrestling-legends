import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ArrowRight } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { SearchInput } from '@/components/ui/GlassInput';
import { GoldButton } from '@/components/ui/GoldButton';
import { WrestlerCard } from '@/components/WrestlerCard';
import { SkeletonCard } from '@/components/ui/skeleton-cards';
import { EmptyState, ErrorState } from '@/components/ui/StateComponents';
import { useWrestlers } from '@/contexts/WrestlerContext';
import { useKioskMode } from '@/hooks/useKioskMode';
import { iranianProvinces } from '@/data/wrestlers';
import { cn } from '@/lib/utils';

export default function WrestlersListPage() {
  useKioskMode();
  const navigate = useNavigate();
  
  const { getVisibleWrestlers, isLoading, error } = useWrestlers();
  const visibleWrestlers = getVisibleWrestlers();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<'all' | 'freestyle' | 'greco-roman'>('all');
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filteredWrestlers = useMemo(() => {
    return visibleWrestlers.filter(wrestler => {
      const matchesSearch = wrestler.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStyle = selectedStyle === 'all' || wrestler.style === selectedStyle;
      const matchesProvince = selectedProvince === 'all' || wrestler.province === selectedProvince;
      return matchesSearch && matchesStyle && matchesProvince;
    });
  }, [visibleWrestlers, searchQuery, selectedStyle, selectedProvince]);

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="relative py-8 px-6 2xl:py-12">
        <div className="container mx-auto">
          {/* Back Button & Title */}
          <div className="flex items-center gap-4 mb-8 animate-fade-in">
            <GoldButton
              variant="ghost"
              size="lg"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowRight className="h-5 w-5" />
              بازگشت
            </GoldButton>
            <div>
              <h1 className="text-3xl md:text-4xl xl:text-5xl font-bold">
                <span className="text-gold">کشتی‌گیران</span>
              </h1>
              <p className="text-muted-foreground text-sm md:text-base mt-1">
                پهلوانان و قهرمانان کشتی ایران
              </p>
            </div>
          </div>

          {/* Search Section */}
          <div className="max-w-3xl space-y-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <SearchInput
              placeholder="جستجو بر اساس نام کشتی‌گیر..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-lg py-4"
            />

            {/* Filter Toggle */}
            <div className="flex">
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
          <p className="text-muted-foreground">
            {filteredWrestlers.length} کشتی‌گیر
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 2xl:gap-8">
            {[...Array(12)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredWrestlers.length === 0 ? (
          <EmptyState
            icon={<Search className="h-16 w-16 2xl:h-20 2xl:w-20" />}
            title="کشتی‌گیری یافت نشد"
            description="با تغییر فیلترها یا عبارت جستجو، نتایج بیشتری پیدا کنید"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 2xl:gap-8">
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
    </div>
  );
}
