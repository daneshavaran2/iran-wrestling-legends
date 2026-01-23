import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useWrestlers } from '@/contexts/WrestlerContext';

export function OfflineIndicator() {
  const { isOffline, refreshWrestlers, isLoading } = useWrestlers();

  if (!isOffline) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground shadow-lg backdrop-blur-sm">
        <WifiOff className="h-4 w-4" />
        <span className="text-sm font-medium">حالت آفلاین</span>
        <button
          onClick={() => refreshWrestlers()}
          disabled={isLoading}
          className="p-1 rounded-full hover:bg-accent/80 transition-colors disabled:opacity-50"
          title="تلاش مجدد"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
}
