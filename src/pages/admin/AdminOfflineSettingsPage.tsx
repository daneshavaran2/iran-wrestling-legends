import { useState } from 'react';
import { Download, Trash2, HardDrive, Clock, Users, History, Building2, BookOpen, Images, Image, RefreshCw, Bell, Timer, FlaskConical, CheckCircle2, XCircle, Loader2, FileText, AlertTriangle, CloudCog, Signal } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DownloadProgressCard } from '@/components/DownloadProgressCard';
import { useOfflineDownload, DEFAULT_SECTIONS, DownloadSection } from '@/hooks/useOfflineDownload';
import { useOfflineData } from '@/contexts/OfflineDataContext';
import { useOfflineTest } from '@/hooks/useOfflineTest';
import { useBackgroundSync } from '@/hooks/useBackgroundSync';
import { useNetworkCondition, getNetworkQualityLabel, getNetworkQualityColor } from '@/hooks/useNetworkCondition';
import { SyncStatusIndicator } from '@/components/SyncStatusIndicator';
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

const SECTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  wrestlers: Users,
  history: History,
  buildings: Building2,
  books: BookOpen,
  albums: Images,
  images: Image,
};

export default function AdminOfflineSettingsPage() {
  const [selectedSections, setSelectedSections] = useState<string[]>(
    DEFAULT_SECTIONS.filter(s => s.enabled).map(s => s.id)
  );

  const {
    progress,
    cacheInfo,
    startFullDownload,
    startSelectiveDownload,
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

  const { runTest, isRunning: isTestRunning, result: testResult, getSwStatusLabel, getSwStatusColor } = useOfflineTest();
  const { syncStatus, lastSyncTime, requestSync, isSupported: isBackgroundSyncSupported, getLastSyncFormatted: getBackgroundSyncFormatted } = useBackgroundSync();
  const networkCondition = useNetworkCondition();

  const handleStartDownload = () => {
    startFullDownload();
    toast.info('دانلود آغاز شد...', {
      description: 'لطفاً صبر کنید تا تمام داده‌ها دانلود شود.',
    });
  };

  const handleSelectiveDownload = () => {
    if (selectedSections.length === 0) {
      toast.error('حداقل یک بخش را انتخاب کنید');
      return;
    }
    startSelectiveDownload(selectedSections);
    toast.info('دانلود انتخابی آغاز شد...', {
      description: `در حال دانلود ${toPersianNumber(selectedSections.length)} بخش`,
    });
  };

  const handleClearCache = () => {
    clearAllCache();
    toast.success('کش پاک شد', {
      description: 'تمام داده‌های ذخیره شده حذف شدند.',
    });
  };

  const toggleSection = (sectionId: string) => {
    setSelectedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const selectAllSections = () => {
    setSelectedSections(DEFAULT_SECTIONS.map(s => s.id));
  };

  const deselectAllSections = () => {
    setSelectedSections([]);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">تنظیمات آفلاین</h1>
          <p className="text-muted-foreground">
            ذخیره داده‌ها برای استفاده بدون اتصال به اینترنت
          </p>
        </div>
        <SyncStatusIndicator />
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
              <h2 className="text-xl font-semibold">دانلود انتخابی</h2>
            </div>

            <p className="text-muted-foreground mb-4">
              بخش‌های مورد نظر را برای دانلود انتخاب کنید:
            </p>

            {/* Section Selection */}
            <div className="space-y-3 mb-6">
              {DEFAULT_SECTIONS.map((section) => {
                const Icon = SECTION_ICONS[section.id] || FileText;
                const isSelected = selectedSections.includes(section.id);
                
                return (
                  <div
                    key={section.id}
                    className={`flex items-center gap-4 p-3 rounded-lg border transition-colors cursor-pointer ${
                      isSelected 
                        ? 'bg-primary/10 border-primary/30' 
                        : 'bg-muted/30 border-border/50 hover:bg-muted/50'
                    }`}
                    onClick={() => toggleSection(section.id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSection(section.id)}
                      className="pointer-events-none"
                    />
                    <Icon className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className="flex-1">
                      <div className="font-medium">{section.label}</div>
                      <div className="text-xs text-muted-foreground">{section.description}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {section.estimatedSize}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selection Controls */}
            <div className="flex gap-2 mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllSections}
              >
                انتخاب همه
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={deselectAllSections}
              >
                لغو انتخاب
              </Button>
            </div>

            {/* Download Buttons */}
            <div className="space-y-3">
              <Button
                className="w-full"
                size="lg"
                onClick={handleSelectiveDownload}
                disabled={selectedSections.length === 0}
              >
                <Download className="h-5 w-5 ml-2" />
                دانلود {toPersianNumber(selectedSections.length)} بخش انتخاب شده
              </Button>

              <Button
                variant="outline"
                className="w-full"
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

      {/* Background Sync Section */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <CloudCog className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold">همگام‌سازی پس‌زمینه</h2>
        </div>

        <div className="space-y-4">
          {/* Browser Support Status */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center gap-3">
              <Signal className="h-5 w-5 text-muted-foreground" />
              <div>
                <span className="font-medium">پشتیبانی مرورگر</span>
                <p className="text-xs text-muted-foreground">
                  قابلیت همگام‌سازی خودکار در پس‌زمینه
                </p>
              </div>
            </div>
            <span className={isBackgroundSyncSupported ? 'text-green-500 font-medium' : 'text-amber-500 font-medium'}>
              {isBackgroundSyncSupported ? 'پشتیبانی می‌شود' : 'پشتیبانی نمی‌شود'}
            </span>
          </div>

          {/* Network Condition */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center gap-3">
              <Signal className="h-5 w-5 text-muted-foreground" />
              <div>
                <span className="font-medium">وضعیت شبکه</span>
                <p className="text-xs text-muted-foreground">
                  کیفیت اتصال فعلی
                </p>
              </div>
            </div>
            <span className={`font-medium ${getNetworkQualityColor(networkCondition.type)}`}>
              {getNetworkQualityLabel(networkCondition.type)}
              {networkCondition.effectiveType && networkCondition.effectiveType !== 'none' && (
                <span className="text-muted-foreground text-xs mr-2">
                  ({networkCondition.effectiveType.toUpperCase()})
                </span>
              )}
            </span>
          </div>

          {/* Last Background Sync */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <span className="font-medium">آخرین همگام‌سازی پس‌زمینه</span>
                <p className="text-xs text-muted-foreground">
                  به‌روزرسانی خودکار توسط Service Worker
                </p>
              </div>
            </div>
            <span className="font-medium">
              {getBackgroundSyncFormatted() || 'هنوز انجام نشده'}
            </span>
          </div>

          {/* Sync Status */}
          {syncStatus !== 'idle' && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/30">
              <RefreshCw className="h-5 w-5 text-primary animate-spin" />
              <span className="font-medium text-primary">
                {syncStatus === 'syncing' ? 'در حال همگام‌سازی...' : 'در انتظار همگام‌سازی...'}
              </span>
            </div>
          )}

          {/* Request Sync Button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={async () => {
              const success = await requestSync();
              if (success) {
                toast.info('درخواست همگام‌سازی ارسال شد', {
                  description: 'داده‌ها در پس‌زمینه به‌روز می‌شوند',
                });
              } else {
                toast.error('همگام‌سازی پس‌زمینه پشتیبانی نمی‌شود', {
                  description: 'از دانلود دستی استفاده کنید',
                });
              }
            }}
            disabled={syncStatus !== 'idle' || !networkCondition.isOnline}
          >
            <CloudCog className={`h-4 w-4 ml-2 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            {syncStatus === 'idle' ? 'درخواست همگام‌سازی پس‌زمینه' : 'در حال همگام‌سازی...'}
          </Button>

          {!isBackgroundSyncSupported && (
            <p className="text-xs text-muted-foreground text-center">
              مرورگر شما از همگام‌سازی پس‌زمینه پشتیبانی نمی‌کند. از دانلود دستی استفاده کنید.
            </p>
          )}
        </div>
      </GlassCard>

      {/* Offline Test Section */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FlaskConical className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold">تست حالت آفلاین</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              runTest();
              toast.info('در حال تست سیستم...');
            }}
            disabled={isTestRunning}
            className="gap-2"
          >
            {isTestRunning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FlaskConical className="h-4 w-4" />
            )}
            شروع تست
          </Button>
        </div>

        {testResult ? (
          <div className="space-y-4">
            {/* Service Worker Status */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
              <span className="text-muted-foreground">Service Worker</span>
              <span className={`font-medium flex items-center gap-2 ${getSwStatusColor(testResult.serviceWorkerStatus)}`}>
                {testResult.serviceWorkerStatus === 'active' && <CheckCircle2 className="h-4 w-4" />}
                {testResult.serviceWorkerStatus === 'none' && <XCircle className="h-4 w-4" />}
                {getSwStatusLabel(testResult.serviceWorkerStatus)}
              </span>
            </div>

            {/* Cache Tests */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {testResult.cacheTests.map((cache, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    cache.status === 'success' 
                      ? 'bg-primary/10 border-primary/30' 
                      : cache.status === 'error'
                      ? 'bg-destructive/10 border-destructive/30'
                      : 'bg-muted/30 border-border/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{cache.name}</span>
                    {cache.status === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : cache.status === 'error' ? (
                      <XCircle className="h-4 w-4 text-destructive" />
                    ) : (
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {toPersianNumber(cache.itemCount)} آیتم • {cache.size}
                  </div>
                </div>
              ))}
            </div>

            {/* Data Integrity */}
            {testResult.dataIntegrity && testResult.dataIntegrity.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">یکپارچگی داده‌ها</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {testResult.dataIntegrity.map((item, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded-lg text-center ${
                        item.status === 'complete' 
                          ? 'bg-primary/10 border border-primary/30' 
                          : item.status === 'partial'
                          ? 'bg-amber-500/10 border border-amber-500/30'
                          : 'bg-muted/30 border border-border/50'
                      }`}
                    >
                      <div className="text-sm font-medium">{item.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {toPersianNumber(item.cachedCount)} آیتم
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {testResult.recommendations && testResult.recommendations.length > 0 && (
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  توصیه‌ها
                </h4>
                <ul className="space-y-1">
                  {testResult.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-muted-foreground">
                      • {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Overall Status */}
            <div className={`p-4 rounded-xl text-center ${
              testResult.isFullyOfflineReady 
                ? 'bg-primary/10 border border-primary/30' 
                : 'bg-muted/30 border border-border/50'
            }`}>
              <div className={`text-lg font-bold flex items-center justify-center gap-2 ${
                testResult.isFullyOfflineReady ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {testResult.isFullyOfflineReady ? (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    برنامه آماده کار در حالت آفلاین است
                  </>
                ) : (
                  <>
                    <Clock className="h-5 w-5" />
                    نیاز به دانلود داده‌ها
                  </>
                )}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                حجم کل: {testResult.totalCacheSize}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <FlaskConical className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>برای بررسی وضعیت آفلاین، روی دکمه «شروع تست» کلیک کنید</p>
          </div>
        )}
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
