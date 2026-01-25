import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, User, WifiOff } from 'lucide-react';
import { GoldButton } from '@/components/ui/GoldButton';
import { useKioskMode } from '@/hooks/useKioskMode';
import { useLanguage } from '@/contexts/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';
import { LazyImage } from '@/components/ui/LazyImage';
import { useOfflineData } from '@/contexts/OfflineDataContext';
import { TranslatedContent } from '@/components/TranslatedContent';

export default function BooksListPage() {
  useKioskMode();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { books, isLoadingBooks, isOffline } = useOfflineData();

  return (
    <div className="h-screen flex flex-col overflow-hidden p-4 md:p-6 page-enter">
      {/* Header */}
      <header className="flex items-center gap-4 mb-4 shrink-0">
        <GoldButton
          variant="ghost"
          size="lg"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 liquid-button"
        >
          <ArrowRight className="h-5 w-5" />
          {t('common.back')}
        </GoldButton>
        <div className="flex items-center gap-3 page-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="p-2 rounded-2xl liquid-glass">
            <BookOpen className="h-6 w-6 text-bronze" />
          </div>
          <h1 className="text-2xl md:text-3xl xl:text-4xl font-bold">
            <span className="text-bronze bronze-glow">{t('books.title')}</span>
          </h1>
          {isOffline && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-500/20 text-yellow-500 text-xs">
              <WifiOff className="h-3 w-3" />
              <span>{t('common.offline')}</span>
            </div>
          )}
        </div>
      </header>

      {/* Books Grid */}
      <main className="flex-1 flex items-center overflow-hidden">
        <div className="w-full max-w-7xl mx-auto">
          {isLoadingBooks ? (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] w-full rounded-3xl" />
              ))}
            </div>
          ) : books.length === 0 ? (
            <div className="liquid-glass p-12 text-center max-w-md mx-auto rounded-3xl">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">{t('books.noContent')}</h3>
              <p className="text-muted-foreground">
                {t('books.noContentDesc')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
              {books.map((book, index) => (
                <div
                  key={book.id}
                  className="group page-slide-up"
                  style={{ animationDelay: `${0.1 + index * 0.06}s` }}
                >
                  {/* 3D Book Card Effect */}
                  <div className="relative cursor-pointer perspective-1000">
                    <div className="relative transition-all duration-500 transform-style-preserve-3d group-hover:rotate-y-[-8deg] group-hover:translate-y-[-8px]">
                      {/* Book spine shadow */}
                      <div className="absolute -left-1 top-2 bottom-2 w-3 bg-gradient-to-l from-black/30 to-transparent rounded-l-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      {/* Book card - Liquid Glass */}
                      <div className="relative overflow-hidden rounded-2xl liquid-glass">
                        {/* Cover Image */}
                        <div className="aspect-[3/4] bg-muted overflow-hidden relative">
                          {book.cover_image_url ? (
                            <LazyImage
                              src={book.cover_image_url}
                              alt={book.title}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-bronze/20 via-bronze/10 to-transparent">
                              <BookOpen className="h-12 w-12 text-bronze/40" />
                            </div>
                          )}
                          
                          {/* Shine effect */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </div>
                        
                        {/* Content */}
                        <div className="p-3 bg-gradient-to-b from-transparent to-black/30">
                          <h2 className="text-sm md:text-base font-bold mb-1 line-clamp-2 group-hover:text-bronze transition-colors duration-300">
                            <TranslatedContent text={book.title} />
                          </h2>
                          <div className="flex items-center gap-1 text-muted-foreground text-xs">
                            <User className="h-3 w-3 flex-shrink-0" />
                            <span className="line-clamp-1">
                              <TranslatedContent text={book.author} />
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Page edges effect */}
                      <div className="absolute top-1 -right-[2px] h-[calc(100%-8px)] w-[3px] bg-gradient-to-r from-bronze/20 to-bronze/10 rounded-r-sm" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
