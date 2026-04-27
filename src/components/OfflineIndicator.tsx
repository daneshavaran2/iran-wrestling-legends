import React, { useContext } from 'react';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { WrestlerContext } from '@/contexts/WrestlerContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOfflineData } from '@/contexts/OfflineDataContext';

export function OfflineIndicator() {
  const context = useContext(WrestlerContext);
  const { t } = useLanguage();
  const { historySections, buildings, books, albums } = useOfflineData();

  // Return null if context is not available (prevents crash during HMR)
  if (!context) return null;

  const { isOffline, refreshWrestlers, isLoading, wrestlers } = context;

  const isReadyForOffline =
    wrestlers.length > 0 &&
    historySections.length > 0 &&
    buildings.length > 0 &&
    albums.length > 0 &&
    books.length > 0;

  if (!isOffline) {
    // When online, briefly indicate offline-readiness in the corner if NOT ready
    if (isReadyForOffline) return null;
    return (
      <div className="fixed bottom-4 left-4 z-40 animate-in fade-in slide-in-from-bottom-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/80 backdrop-blur-sm border border-border text-xs text-muted-foreground shadow">
          <CheckCircle2 className="h-3.5 w-3.5 opacity-50" />
          <span>{t('common.offlineNotReady')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground shadow-lg backdrop-blur-sm">
        <WifiOff className="h-4 w-4" />
        <span className="text-sm font-medium">{t('common.offline')}</span>
        <button
          onClick={() => refreshWrestlers()}
          disabled={isLoading}
          className="p-1 rounded-full hover:bg-accent/80 transition-colors disabled:opacity-50"
          title={t('common.retry')}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
}
