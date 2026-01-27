import React, { useState, useEffect } from 'react';
import { 
  Image, 
  Settings, 
  Zap, 
  Loader2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  HardDrive
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { optimizeImage } from '@/utils/imageCompressor';

// Types
export interface CompressionOptions {
  quality: number;
  maxWidth: number;
  maxHeight: number;
  outputFormat: 'webp' | 'jpeg';
}

interface BatchProgress {
  total: number;
  processed: number;
  skipped: number;
  failed: number;
  savedBytes: number;
  originalBytes: number;
  isRunning: boolean;
  currentFile?: string;
  startTime?: number;
}

// Storage key for persisting settings
const COMPRESSION_SETTINGS_KEY = 'compression_settings';

// Default settings
const DEFAULT_SETTINGS: CompressionOptions = {
  quality: 82,
  maxWidth: 1920,
  maxHeight: 1080,
  outputFormat: 'webp'
};

// Get compression settings from localStorage
export function getCompressionSettings(): CompressionOptions {
  try {
    const saved = localStorage.getItem(COMPRESSION_SETTINGS_KEY);
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('Failed to load compression settings:', e);
  }
  return DEFAULT_SETTINGS;
}

// Save compression settings to localStorage
export function saveCompressionSettings(settings: CompressionOptions): void {
  localStorage.setItem(COMPRESSION_SETTINGS_KEY, JSON.stringify(settings));
}

export default function CompressionSettings() {
  const [settings, setSettings] = useState<CompressionOptions>(getCompressionSettings());
  const [hasChanges, setHasChanges] = useState(false);
  const [batchProgress, setBatchProgress] = useState<BatchProgress>({
    total: 0,
    processed: 0,
    skipped: 0,
    failed: 0,
    savedBytes: 0,
    originalBytes: 0,
    isRunning: false,
    startTime: undefined
  });

  // Load saved settings on mount
  useEffect(() => {
    setSettings(getCompressionSettings());
  }, []);

  const handleSettingChange = <K extends keyof CompressionOptions>(
    key: K, 
    value: CompressionOptions[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSaveSettings = () => {
    saveCompressionSettings(settings);
    setHasChanges(false);
    toast.success('تنظیمات فشرده‌سازی ذخیره شد');
  };

  const handleResetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    saveCompressionSettings(DEFAULT_SETTINGS);
    setHasChanges(false);
    toast.success('تنظیمات به حالت پیش‌فرض بازگشت');
  };

  // Batch compression for existing images
  const handleBatchCompress = async (bucket: string) => {
    if (batchProgress.isRunning) return;

    setBatchProgress({
      total: 0,
      processed: 0,
      skipped: 0,
      failed: 0,
      savedBytes: 0,
      originalBytes: 0,
      isRunning: true,
      startTime: Date.now()
    });

    try {
      // List all files in the bucket
      const { data: folders, error: foldersError } = await supabase.storage
        .from(bucket)
        .list('', { limit: 1000 });

      if (foldersError) throw foldersError;

      // Collect all image files
      const allFiles: { path: string; size: number }[] = [];
      
      for (const folder of folders || []) {
        if (folder.id) {
          // It's a folder, list its contents
          const { data: files } = await supabase.storage
            .from(bucket)
            .list(folder.name, { limit: 1000 });
          
          if (files) {
            for (const file of files) {
              if (file.metadata?.mimetype?.startsWith('image/') && 
                  !file.name.endsWith('.webp')) {
                allFiles.push({
                  path: `${folder.name}/${file.name}`,
                  size: file.metadata.size || 0
                });
              }
            }
          }
        } else if (folder.metadata?.mimetype?.startsWith('image/') && 
                   !folder.name.endsWith('.webp')) {
          // It's a file at root level
          allFiles.push({
            path: folder.name,
            size: folder.metadata.size || 0
          });
        }
      }

      setBatchProgress(prev => ({ ...prev, total: allFiles.length }));

      if (allFiles.length === 0) {
        toast.info('هیچ تصویر غیر-WebP یافت نشد');
        setBatchProgress(prev => ({ ...prev, isRunning: false }));
        return;
      }

      let totalSaved = 0;
      let totalOriginal = 0;
      let processed = 0;
      let skipped = 0;
      let failed = 0;

      for (const fileInfo of allFiles) {
        try {
          setBatchProgress(prev => ({ 
            ...prev, 
            currentFile: fileInfo.path 
          }));

          // Download the file
          const { data: fileData, error: downloadError } = await supabase.storage
            .from(bucket)
            .download(fileInfo.path);

          if (downloadError || !fileData) {
            failed++;
            continue;
          }

          // Convert to File object
          const file = new File(
            [fileData], 
            fileInfo.path.split('/').pop() || 'image',
            { type: fileData.type }
          );

          // Skip small files
          if (file.size < 100 * 1024) {
            skipped++;
            setBatchProgress(prev => ({ 
              ...prev, 
              processed: prev.processed + 1,
              skipped: prev.skipped + 1
            }));
            continue;
          }

          // Optimize the image
          const optimizedFile = await optimizeImage(file, settings);

          // Only upload if we actually reduced size
          if (optimizedFile.size < file.size) {
            const savedBytes = file.size - optimizedFile.size;
            totalSaved += savedBytes;
            totalOriginal += file.size;

            // Generate new path with .webp extension
            const newPath = fileInfo.path.replace(/\.[^.]+$/, '.webp');

            // Upload optimized file
            const { error: uploadError } = await supabase.storage
              .from(bucket)
              .upload(newPath, optimizedFile, {
                cacheControl: '31536000',
                upsert: true
              });

            if (uploadError) {
              failed++;
            } else {
              processed++;
              // Optionally delete original (skip for safety)
              // await supabase.storage.from(bucket).remove([fileInfo.path]);
            }
          } else {
            skipped++;
          }

          setBatchProgress(prev => ({
            ...prev,
            processed: processed,
            skipped: skipped,
            failed: failed,
            savedBytes: totalSaved,
            originalBytes: totalOriginal
          }));

        } catch (e) {
          console.error(`Failed to process ${fileInfo.path}:`, e);
          failed++;
        }
      }

      const savedMB = (totalSaved / (1024 * 1024)).toFixed(2);
      toast.success(`فشرده‌سازی کامل شد! ${savedMB}MB صرفه‌جویی شد`);

      // Save compression history to localStorage for dashboard display
      try {
        const historyKey = 'compression_history';
        const existingHistory = JSON.parse(localStorage.getItem(historyKey) || '{}');
        const updatedHistory = {
          totalOriginal: (existingHistory.totalOriginal || 0) + totalOriginal,
          totalCompressed: (existingHistory.totalCompressed || 0) + (totalOriginal - totalSaved),
          savedBytes: (existingHistory.savedBytes || 0) + totalSaved,
          lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
      } catch (e) {
        console.warn('Failed to save compression history:', e);
      }

    } catch (error) {
      console.error('Batch compression failed:', error);
      toast.error('خطا در فشرده‌سازی دسته‌ای');
    } finally {
      setBatchProgress(prev => ({ ...prev, isRunning: false, currentFile: undefined }));
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <GlassCard className="p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Image className="h-5 w-5 text-primary" />
        تنظیمات فشرده‌سازی تصاویر
      </h2>

      <div className="space-y-6">
        {/* Quality Setting */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">کیفیت تصویر</Label>
            <span className="text-sm text-primary font-bold">{settings.quality}%</span>
          </div>
          <Slider
            value={[settings.quality]}
            onValueChange={([value]) => handleSettingChange('quality', value)}
            min={50}
            max={95}
            step={5}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            کیفیت بالاتر = حجم بیشتر | پیشنهاد: ۸۰-۸۵٪
          </p>
        </div>

        {/* Max Width Setting */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">حداکثر عرض</Label>
            <span className="text-sm text-primary font-bold">{settings.maxWidth}px</span>
          </div>
          <Slider
            value={[settings.maxWidth]}
            onValueChange={([value]) => handleSettingChange('maxWidth', value)}
            min={800}
            max={2560}
            step={160}
            className="w-full"
          />
        </div>

        {/* Max Height Setting */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">حداکثر ارتفاع</Label>
            <span className="text-sm text-primary font-bold">{settings.maxHeight}px</span>
          </div>
          <Slider
            value={[settings.maxHeight]}
            onValueChange={([value]) => handleSettingChange('maxHeight', value)}
            min={600}
            max={1920}
            step={120}
            className="w-full"
          />
        </div>

        {/* Output Format */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">فرمت خروجی</Label>
          <div className="flex gap-2">
            <Button
              variant={settings.outputFormat === 'webp' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSettingChange('outputFormat', 'webp')}
              className="flex-1"
            >
              <Zap className="h-4 w-4 ml-1" />
              WebP (کوچکتر)
            </Button>
            <Button
              variant={settings.outputFormat === 'jpeg' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSettingChange('outputFormat', 'jpeg')}
              className="flex-1"
            >
              JPEG (سازگار)
            </Button>
          </div>
        </div>

        {/* Save/Reset Buttons */}
        <div className="flex gap-3 pt-2 border-t border-border">
          <Button
            onClick={handleSaveSettings}
            disabled={!hasChanges}
            className="flex-1"
          >
            <CheckCircle className="h-4 w-4 ml-2" />
            ذخیره تنظیمات
          </Button>
          <Button
            variant="outline"
            onClick={handleResetSettings}
          >
            <RefreshCw className="h-4 w-4 ml-2" />
            پیش‌فرض
          </Button>
        </div>

        {/* Batch Compression Section */}
        <div className="pt-4 border-t border-border space-y-4">
          <h3 className="font-medium flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-primary" />
            فشرده‌سازی دسته‌ای تصاویر موجود
          </h3>

          <p className="text-sm text-muted-foreground">
            تصاویر موجود در storage که WebP نیستند را فشرده کنید. این عملیات ممکن است چند دقیقه طول بکشد.
          </p>

          {/* Progress Display */}
          {batchProgress.isRunning && (
            <div className="space-y-2 p-4 rounded-xl bg-muted/30">
              <div className="flex items-center justify-between text-sm">
                <span>در حال پردازش...</span>
                <span className="text-primary">
                  {batchProgress.processed + batchProgress.skipped} / {batchProgress.total}
                </span>
              </div>
              <Progress 
                value={batchProgress.total > 0 
                  ? ((batchProgress.processed + batchProgress.skipped) / batchProgress.total) * 100 
                  : 0
                } 
              />
              {batchProgress.currentFile && (
                <p className="text-xs text-muted-foreground truncate">
                  {batchProgress.currentFile}
                </p>
              )}
              {/* ETA calculation */}
              {batchProgress.startTime && batchProgress.processed > 0 && (
                <div className="text-xs text-muted-foreground">
                  {(() => {
                    const elapsed = (Date.now() - batchProgress.startTime) / 1000;
                    const rate = (batchProgress.processed + batchProgress.skipped) / elapsed;
                    const remaining = batchProgress.total - (batchProgress.processed + batchProgress.skipped);
                    const eta = remaining / rate;
                    const minutes = Math.floor(eta / 60);
                    const seconds = Math.floor(eta % 60);
                    return (
                      <span>⏱️ زمان باقیمانده: {minutes > 0 ? `${minutes} دقیقه و ` : ''}{seconds} ثانیه | 📊 سرعت: {rate.toFixed(1)} فایل/ثانیه</span>
                    );
                  })()}
                </div>
              )}
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span className="text-primary">✓ {batchProgress.processed} فشرده شد</span>
                <span className="text-accent">⏭ {batchProgress.skipped} رد شد</span>
                <span className="text-destructive">✗ {batchProgress.failed} خطا</span>
              </div>
              {batchProgress.savedBytes > 0 && (
                <p className="text-sm text-primary font-medium">
                  💾 {formatBytes(batchProgress.savedBytes)} صرفه‌جویی شد
                </p>
              )}
            </div>
          )}

          {/* Batch Compression Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBatchCompress('wrestler-media')}
              disabled={batchProgress.isRunning}
            >
              {batchProgress.isRunning ? (
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              ) : (
                <Image className="h-4 w-4 ml-2" />
              )}
              کشتی‌گیرها
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBatchCompress('album-media')}
              disabled={batchProgress.isRunning}
            >
              {batchProgress.isRunning ? (
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              ) : (
                <Image className="h-4 w-4 ml-2" />
              )}
              آلبوم‌ها
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBatchCompress('building-media')}
              disabled={batchProgress.isRunning}
            >
              {batchProgress.isRunning ? (
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              ) : (
                <Image className="h-4 w-4 ml-2" />
              )}
              بناها
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBatchCompress('museum-audio')}
              disabled={batchProgress.isRunning}
            >
              {batchProgress.isRunning ? (
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              ) : (
                <AlertCircle className="h-4 w-4 ml-2" />
              )}
              سایر
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            ⚠️ فایل‌های اصلی حذف نمی‌شوند. نسخه WebP در کنار آن‌ها ذخیره می‌شود.
          </p>
        </div>
      </div>
    </GlassCard>
  );
}
