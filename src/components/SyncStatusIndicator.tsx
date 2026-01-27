import React from 'react';
import { RefreshCw, WifiOff, Cloud, CloudOff, Signal, SignalLow, SignalMedium, SignalHigh } from 'lucide-react';
import { useBackgroundSync } from '@/hooks/useBackgroundSync';
import { useNetworkCondition, getNetworkQualityLabel } from '@/hooks/useNetworkCondition';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SyncStatusIndicatorProps {
  showLabel?: boolean;
  compact?: boolean;
}

export function SyncStatusIndicator({ showLabel = true, compact = false }: SyncStatusIndicatorProps) {
  const { syncStatus, getLastSyncFormatted } = useBackgroundSync();
  const networkCondition = useNetworkCondition();
  
  const getSignalIcon = () => {
    switch (networkCondition.type) {
      case 'excellent':
        return <SignalHigh className="h-4 w-4" />;
      case 'good':
        return <SignalMedium className="h-4 w-4" />;
      case 'fair':
        return <SignalLow className="h-4 w-4" />;
      case 'poor':
        return <Signal className="h-4 w-4" />;
      case 'offline':
        return <WifiOff className="h-4 w-4" />;
    }
  };
  
  const getStatusColor = () => {
    if (syncStatus === 'syncing') return 'text-primary';
    if (!networkCondition.isOnline) return 'text-amber-500';
    
    switch (networkCondition.type) {
      case 'excellent':
      case 'good':
        return 'text-green-500';
      case 'fair':
        return 'text-amber-500';
      case 'poor':
        return 'text-orange-500';
      case 'offline':
        return 'text-red-500';
      default:
        return 'text-muted-foreground';
    }
  };
  
  const getStatusLabel = () => {
    if (syncStatus === 'syncing') return 'در حال همگام‌سازی...';
    if (syncStatus === 'pending') return 'در انتظار همگام‌سازی';
    if (!networkCondition.isOnline) return 'آفلاین';
    return getNetworkQualityLabel(networkCondition.type);
  };
  
  const content = (
    <div className={`flex items-center gap-2 ${getStatusColor()}`}>
      {syncStatus === 'syncing' ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : networkCondition.isOnline ? (
        <>
          {getSignalIcon()}
          <Cloud className="h-4 w-4" />
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <CloudOff className="h-4 w-4" />
        </>
      )}
      {showLabel && !compact && (
        <span className="text-xs font-medium">{getStatusLabel()}</span>
      )}
    </div>
  );
  
  const lastSync = getLastSyncFormatted();
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-default">
            {content}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-center">
          <div className="space-y-1">
            <div className="font-medium">{getStatusLabel()}</div>
            {networkCondition.isOnline && networkCondition.effectiveType && (
              <div className="text-xs text-muted-foreground">
                نوع اتصال: {networkCondition.effectiveType.toUpperCase()}
              </div>
            )}
            {lastSync && (
              <div className="text-xs text-muted-foreground">
                آخرین همگام‌سازی: {lastSync}
              </div>
            )}
            {networkCondition.rtt > 0 && (
              <div className="text-xs text-muted-foreground">
                تاخیر: {networkCondition.rtt}ms
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
