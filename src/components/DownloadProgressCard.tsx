import { Download, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { DownloadProgress } from '@/hooks/useOfflineDownload';
import { cn } from '@/lib/utils';

interface DownloadProgressCardProps {
  progress: DownloadProgress;
  downloadedBytes: number;
  onCancel: () => void;
  formatBytes: (bytes: number) => string;
  toPersianNumber: (num: number) => string;
}

export function DownloadProgressCard({
  progress,
  downloadedBytes,
  onCancel,
  formatBytes,
  toPersianNumber,
}: DownloadProgressCardProps) {
  const isComplete = progress.stage === 'complete';
  const isError = progress.stage === 'error';
  const isDownloading = progress.isDownloading;

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-3 mb-4">
        {isComplete ? (
          <CheckCircle2 className="h-6 w-6 text-accent-foreground" />
        ) : isError ? (
          <AlertCircle className="h-6 w-6 text-destructive" />
        ) : isDownloading ? (
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
        ) : (
          <Download className="h-6 w-6 text-primary" />
        )}
        <h3 className="text-lg font-semibold">
          {isComplete ? 'دانلود تکمیل شد' : isError ? 'خطا در دانلود' : 'در حال دانلود...'}
        </h3>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <Progress 
          value={progress.percentage} 
          className={cn(
            "h-3",
            isComplete && "bg-accent/20",
            isError && "bg-destructive/20"
          )}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 rounded-lg bg-muted/30">
          <div className="text-2xl font-bold text-primary">
            {toPersianNumber(progress.percentage)}٪
          </div>
          <div className="text-sm text-muted-foreground">پیشرفت</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-muted/30">
          <div className="text-2xl font-bold text-primary">
            {formatBytes(downloadedBytes)}
          </div>
          <div className="text-sm text-muted-foreground">دانلود شده</div>
        </div>
      </div>

      {/* Current Stage */}
      {isDownloading && (
        <div className="mb-4 p-3 rounded-lg bg-muted/20 border border-border/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">مرحله فعلی:</span>
            <span className="text-sm font-medium">{progress.stageName}</span>
          </div>
          {progress.stage === 'images' && progress.totalItems > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">تصاویر:</span>
              <span className="text-sm font-medium">
                {toPersianNumber(progress.currentItem)} از {toPersianNumber(progress.totalItems)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {isError && progress.error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          {progress.error}
        </div>
      )}

      {/* Cancel Button */}
      {isDownloading && (
        <Button
          variant="outline"
          className="w-full"
          onClick={onCancel}
        >
          <X className="h-4 w-4 ml-2" />
          لغو دانلود
        </Button>
      )}
    </GlassCard>
  );
}
