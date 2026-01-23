import { Download, Trash2, HardDrive, Clock, Users, History, Building2, BookOpen, Images, Image, RefreshCw, Bell, Timer } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DownloadProgressCard } from '@/components/DownloadProgressCard';
import { useOfflineDownload } from '@/hooks/useOfflineDownload';
import { useOfflineData } from '@/contexts/OfflineDataContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export default function AdminOfflineSettingsPage() {
  const {
    progress,
    cacheInfo,
    startFullDownload,
    cancelDownload,
    clearAllCache,
    formatBytes,
    toPersianNumber,
  } = useOfflineDownload();

  const {
    autoSyncSettings,
    updateAutoSyncSettings,
    isSyncing,
    syncNow,
    getTimeUntilNextSync,
    getLastSyncFormatted,
  } = useOfflineData();

  const handleStartDownload = () => {
    startFullDownload();
    toast.info('دانلود آغاز شد...', {
      description: 'لطفاً صبر کنید تا تمام داده‌ها دانلود شود.',
    });
  };

  const handleClearCache = () => {
    clearAllCache();
    toast.success('کش پاک شد', {
      description: 'تمام داده‌های ذخیره شده حذف شدند.',
    });
  };

  const cacheStats = [
    { label: 'کشتی‌گیرها', count: cacheInfo.itemCounts.wrestlers, icon: Users },
    { label: 'تاریخچه', count: cacheInfo.itemCounts.history, icon: History },
    { label: 'بناها', count: cacheInfo.itemCounts.buildings, icon: Building2 },
    { label: 'کتاب‌ها', count: cacheInfo.itemCounts.books, icon: BookOpen },
    { label: 'آلبوم‌ها', count: cacheInfo.itemCounts.albums, icon: Images },
    { label: 'تصاویر', count: cacheInfo.itemCounts.images, icon: Image },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">تنظیمات آفلاین</h1>
        <p className="text-muted-foreground">
          ذخیره داده‌ها برای استفاده بدون اتصال به اینترنت
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cache Status Card */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <HardDrive className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold">وضعیت کش فعلی</h2>
          </div>

          {/* Storage Info */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <div className="text-3xl font-bold text-primary mb-1">
                {cacheInfo.totalSizeFormatted}
              </div>
              <div className="text-sm text-muted-foreground">حجم ذخیره شده</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-sm font-medium">
                {cacheInfo.lastUpdate || 'هنوز به‌روزرسانی نشده'}
              </div>
              <div className="text-xs text-muted-foreground">آخرین به‌روزرسانی</div>
            </div>
          </div>

          {/* Item Counts */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {cacheStats.map((stat) => {
              const Icon = stat.icon;
              const hasData = stat.count > 0;
              
              return (
                <div
                  key={stat.label}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    hasData 
                      ? 'bg-accent/10 border border-accent/20' 
                      : 'bg-muted/30 border border-border/50'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${hasData ? 'text-accent-foreground' : 'text-muted-foreground'}`} />
                  <div>
                    <div className={`text-lg font-semibold ${hasData ? 'text-accent-foreground' : 'text-muted-foreground'}`}>
                      {toPersianNumber(stat.count)}
                    </div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Download Section */}
        {progress.isDownloading || progress.stage === 'complete' || progress.stage === 'error' ? (
          <DownloadProgressCard
            progress={progress}
            downloadedBytes={progress.downloadedBytes}
            onCancel={cancelDownload}
            formatBytes={formatBytes}
            toPersianNumber={toPersianNumber}
          />
        ) : (
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Download className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-semibold">دانلود برای حالت آفلاین</h2>
            </div>

            <p className="text-muted-foreground mb-6">
              با دانلود داده‌ها، می‌توانید بدون اتصال به اینترنت از برنامه استفاده کنید. 
              این شامل تمام کشتی‌گیرها، تاریخچه، بناها، کتاب‌ها، آلبوم‌ها و تصاویر می‌شود.
            </p>

            <div className="space-y-3">
              <Button
                className="w-full"
                size="lg"
                onClick={handleStartDownload}
              >
                <Download className="h-5 w-5 ml-2" />
                دانلود همه داده‌ها
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full text-destructive hover:text-destructive"
                    size="lg"
                    disabled={cacheInfo.totalSize === 0}
                  >
                    <Trash2 className="h-5 w-5 ml-2" />
                    پاک کردن کش
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>پاک کردن کش</AlertDialogTitle>
                    <AlertDialogDescription>
                      آیا مطمئن هستید؟ تمام داده‌های ذخیره شده برای حالت آفلاین حذف خواهند شد.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>انصراف</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearCache}>
                      بله، پاک کن
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </GlassCard>
        )}
      </div>

      {/* Auto Sync Section */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <RefreshCw className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold">به‌روزرسانی اتوماتیک</h2>
        </div>

        <div className="space-y-6">
          {/* Enable/Disable Auto Sync */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center gap-3">
              <Timer className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="auto-sync" className="font-medium">به‌روزرسانی خودکار</Label>
                <p className="text-xs text-muted-foreground">
                  داده‌ها به صورت دوره‌ای به‌روز می‌شوند
                </p>
              </div>
            </div>
            <Switch
              id="auto-sync"
              checked={autoSyncSettings.enabled}
              onCheckedChange={(checked) => updateAutoSyncSettings({ enabled: checked })}
            />
          </div>

          {/* Interval Selection */}
          {autoSyncSettings.enabled && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label className="font-medium">بازه زمانی</Label>
                  <p className="text-xs text-muted-foreground">
                    هر چند ساعت یک‌بار به‌روزرسانی شود
                  </p>
                </div>
              </div>
              <Select
                value={autoSyncSettings.intervalHours.toString()}
                onValueChange={(value) => updateAutoSyncSettings({ intervalHours: parseInt(value) })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">۶ ساعت</SelectItem>
                  <SelectItem value="12">۱۲ ساعت</SelectItem>
                  <SelectItem value="24">۲۴ ساعت</SelectItem>
                  <SelectItem value="48">۴۸ ساعت</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Show Notification */}
          {autoSyncSettings.enabled && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="show-notification" className="font-medium">نمایش اعلان</Label>
                  <p className="text-xs text-muted-foreground">
                    هنگام به‌روزرسانی اعلان نمایش داده شود
                  </p>
                </div>
              </div>
              <Switch
                id="show-notification"
                checked={autoSyncSettings.showNotification}
                onCheckedChange={(checked) => updateAutoSyncSettings({ showNotification: checked })}
              />
            </div>
          )}

          {/* Sync Status */}
          {autoSyncSettings.enabled && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="text-center p-3 rounded-lg bg-muted/20">
                <div className="text-sm text-muted-foreground mb-1">آخرین به‌روزرسانی</div>
                <div className="font-medium">{getLastSyncFormatted() || 'هنوز انجام نشده'}</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/20">
                <div className="text-sm text-muted-foreground mb-1">به‌روزرسانی بعدی</div>
                <div className="font-medium">{getTimeUntilNextSync() || 'نامشخص'}</div>
              </div>
            </div>
          )}

          {/* Manual Sync Button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              syncNow();
              toast.info('در حال به‌روزرسانی دستی...');
            }}
            disabled={isSyncing}
          >
            <RefreshCw className={`h-4 w-4 ml-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'در حال به‌روزرسانی...' : 'به‌روزرسانی دستی'}
          </Button>
        </div>
      </GlassCard>

      {/* Tips Section */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold mb-4">نکات مهم</h3>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>دانلود داده‌ها ممکن است چند دقیقه طول بکشد، بسته به سرعت اینترنت شما.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>پس از دانلود، برنامه به صورت کامل در حالت آفلاین کار خواهد کرد.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>با فعال کردن به‌روزرسانی اتوماتیک، داده‌ها همیشه به‌روز خواهند بود.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>داده‌ها در حافظه مرورگر ذخیره می‌شوند و با پاک کردن کش مرورگر از بین می‌روند.</span>
          </li>
        </ul>
      </GlassCard>
    </div>
  );
}
