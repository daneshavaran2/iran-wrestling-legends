import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ArrowRight } from 'lucide-react';
import { SearchInput } from '@/components/ui/GlassInput';
import { GoldButton } from '@/components/ui/GoldButton';
import { WrestlerCard } from '@/components/WrestlerCard';
import { SkeletonCard } from '@/components/ui/skeleton-cards';
import { EmptyState, ErrorState } from '@/components/ui/StateComponents';
import { useWrestlers } from '@/contexts/WrestlerContext';
import { useKioskMode } from '@/hooks/useKioskMode';
import { useLanguage } from '@/contexts/LanguageContext';
import { iranianProvinces } from '@/data/wrestlers';
import { cn } from '@/lib/utils';

export default function WrestlersListPage() {
  useKioskMode();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const { wrestlers, getVisibleWrestlers, isLoading, error } = useWrestlers();
  
  // Use useMemo with wrestlers dependency to re-calculate after fetch completes
  const visibleWrestlers = useMemo(() => getVisibleWrestlers(), [wrestlers]);
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
    <div className="min-h-screen page-enter">
      {/* Header */}
      <header className="relative py-8 px-6 2xl:py-12">
        <div className="container mx-auto">
          {/* Back Button & Title */}
          <div className="flex items-center gap-4 mb-8">
            <GoldButton
              variant="ghost"
              size="lg"
              onClick={() => navigate('/')}
              className="flex items-center gap-2 liquid-button"
            >
              <ArrowRight className="h-5 w-5" />
              {t('common.back')}
            </GoldButton>
            <div className="page-slide-up" style={{ animationDelay: '0.1s' }}>
              <h1 className="text-3xl md:text-4xl xl:text-5xl font-bold">
                <span className="text-bronze bronze-glow">{t('wrestler.title')}</span>
              </h1>
              <p className="text-muted-foreground text-sm md:text-base mt-1">
                {t('wrestler.subtitle')}
              </p>
            </div>
          </div>

          {/* Search Section */}
          <div className="max-w-3xl space-y-4 page-slide-up" style={{ animationDelay: '0.2s' }}>
            <SearchInput
              placeholder={t('wrestler.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-lg py-4"
            />

            {/* Filter Toggle */}
            <div className="flex">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 liquid-button px-4 py-2 text-sm"
              >
                <Filter className="h-4 w-4" />
                {t('common.filter')}
              </button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="liquid-glass p-6 rounded-3xl page-slide-up">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Style Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-3 text-muted-foreground">
                      {t('wrestler.style')}
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { value: 'all', label: t('common.all') },
                        { value: 'freestyle', label: t('wrestler.freestyle') },
                        { value: 'greco-roman', label: t('wrestler.grecoRoman') },
                      ].map(option => (
                        <button
                          key={option.value}
                          onClick={() => setSelectedStyle(option.value as any)}
                          className={cn(
                            'px-4 py-2 rounded-xl transition-all duration-300',
                            selectedStyle === option.value
                              ? 'gold-button'
                              : 'liquid-button'
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
                      {t('wrestler.province')}
                    </label>
                    <select
                      value={selectedProvince}
                      onChange={(e) => setSelectedProvince(e.target.value)}
                      className="glass-input cursor-pointer"
                    >
                      <option value="all">{t('wrestler.allProvinces')}</option>
                      {iranianProvinces.map(province => (
                        <option key={province} value={province}>
                          {province}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Wrestlers Grid */}
      <main className="container mx-auto px-6 pb-12">
        <div className="flex items-center justify-between mb-8 page-slide-up" style={{ animationDelay: '0.3s' }}>
          <p className="text-muted-foreground">
            {t('wrestler.count').replace('{count}', String(filteredWrestlers.length))}
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
            title={t('wrestler.notFound')}
            description={t('wrestler.notFoundDesc')}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 2xl:gap-8">
            {filteredWrestlers.map((wrestler, index) => (
              <div
                key={wrestler.id}
                className="page-slide-up"
                style={{ animationDelay: `${0.3 + index * 0.05}s` }}
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
