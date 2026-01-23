import React, { useState, useEffect, useRef } from 'react';
import { Music, Upload, Trash2, Play, Pause, Volume2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GoldButton } from '@/components/ui/GoldButton';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function AdminAudioPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [musicVolume, setMusicVolume] = useState(0.3);
  const [musicAutoplay, setMusicAutoplay] = useState(false);
  
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewVolume, setPreviewVolume] = useState(0.3);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('bg_music_url, bg_music_enabled, bg_music_volume, bg_music_autoplay')
          .single();

        if (error) throw error;

        if (data) {
          setMusicUrl(data.bg_music_url);
          setMusicEnabled(data.bg_music_enabled ?? true);
          setMusicVolume(data.bg_music_volume ?? 0.3);
          setMusicAutoplay(data.bg_music_autoplay ?? false);
          setPreviewVolume(data.bg_music_volume ?? 0.3);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast.error('خطا در دریافت تنظیمات');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Initialize audio for preview
  useEffect(() => {
    if (musicUrl) {
      audioRef.current = new Audio(musicUrl);
      audioRef.current.loop = true;
      audioRef.current.volume = previewVolume;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, [musicUrl]);

  // Update preview volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = previewVolume;
    }
  }, [previewVolume]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3'];
    if (!validTypes.includes(file.type)) {
      toast.error('فقط فایل‌های MP3، WAV و OGG پذیرفته می‌شوند');
      return;
    }

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast.error('حداکثر اندازه فایل ۲۰ مگابایت است');
      return;
    }

    setIsUploading(true);

    try {
      // Delete old file if exists
      if (musicUrl) {
        const oldPath = musicUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('museum-audio').remove([oldPath]);
        }
      }

      // Upload new file
      const fileName = `bg-music-${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage
        .from('museum-audio')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('museum-audio')
        .getPublicUrl(fileName);

      setMusicUrl(urlData.publicUrl);
      toast.success('فایل با موفقیت آپلود شد');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('خطا در آپلود فایل');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAudio = async () => {
    if (!musicUrl) return;

    try {
      const fileName = musicUrl.split('/').pop();
      if (fileName) {
        await supabase.storage.from('museum-audio').remove([fileName]);
      }
      setMusicUrl(null);
      setIsPreviewPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
      toast.success('فایل حذف شد');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('خطا در حذف فایل');
    }
  };

  const togglePreview = () => {
    if (!audioRef.current || !musicUrl) return;

    if (isPreviewPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
    setIsPreviewPlaying(!isPreviewPlaying);
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('app_settings')
        .update({
          bg_music_url: musicUrl,
          bg_music_enabled: musicEnabled,
          bg_music_volume: musicVolume,
          bg_music_autoplay: musicAutoplay,
        })
        .eq('id', (await supabase.from('app_settings').select('id').single()).data?.id);

      if (error) throw error;

      toast.success('تنظیمات ذخیره شد');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('خطا در ذخیره تنظیمات');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-primary/10">
          <Music className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">تنظیمات موسیقی پس‌زمینه</h1>
          <p className="text-muted-foreground">مدیریت موسیقی پس‌زمینه موزه</p>
        </div>
      </div>

      {/* Upload Section */}
      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Upload className="h-5 w-5" />
          آپلود فایل صوتی
        </h2>
        
        <div className="space-y-4">
          {musicUrl ? (
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
              <div className="flex items-center gap-3">
                <Music className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">فایل موسیقی آپلود شده</p>
                  <p className="text-sm text-muted-foreground truncate max-w-xs">
                    {musicUrl.split('/').pop()}
                  </p>
                </div>
              </div>
              <button
                onClick={handleDeleteAudio}
                className="px-3 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors flex items-center gap-2 text-sm"
              >
                <Trash2 className="h-4 w-4" />
                حذف
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
              <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                فایل MP3، WAV یا OGG خود را آپلود کنید
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                حداکثر اندازه: ۲۰ مگابایت
              </p>
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/mpeg,audio/wav,audio/ogg,audio/mp3"
            onChange={handleFileUpload}
            className="hidden"
          />
          
          <GoldButton
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full"
          >
            {isUploading ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                در حال آپلود...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                {musicUrl ? 'جایگزینی فایل' : 'آپلود فایل جدید'}
              </span>
            )}
          </GoldButton>
        </div>
      </GlassCard>

      {/* Preview Section */}
      {musicUrl && (
        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            پیش‌نمایش
          </h2>
          
          <div className="flex items-center gap-4">
            <button
              onClick={togglePreview}
              className="h-12 w-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center"
            >
              {isPreviewPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 mr-0.5" />
              )}
            </button>
            
            <div className="flex-1">
              <Slider
                value={[previewVolume * 100]}
                onValueChange={([v]) => setPreviewVolume(v / 100)}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
            
            <span className="text-sm text-muted-foreground w-12 text-left">
              {Math.round(previewVolume * 100)}%
            </span>
          </div>
        </GlassCard>
      )}

      {/* Settings Section */}
      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold mb-4">تنظیمات پخش</h2>
        
        <div className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <Label htmlFor="music-enabled" className="flex flex-col gap-1">
              <span>فعال بودن موسیقی پس‌زمینه</span>
              <span className="text-sm text-muted-foreground font-normal">
                موسیقی در صفحات عمومی پخش می‌شود
              </span>
            </Label>
            <Switch
              id="music-enabled"
              checked={musicEnabled}
              onCheckedChange={setMusicEnabled}
            />
          </div>

          {/* Autoplay */}
          <div className="flex items-center justify-between">
            <Label htmlFor="music-autoplay" className="flex flex-col gap-1">
              <span>پخش خودکار هنگام ورود</span>
              <span className="text-sm text-muted-foreground font-normal">
                موسیقی به صورت خودکار پخش می‌شود
              </span>
            </Label>
            <Switch
              id="music-autoplay"
              checked={musicAutoplay}
              onCheckedChange={setMusicAutoplay}
            />
          </div>

          {/* Default Volume */}
          <div className="space-y-3">
            <Label className="flex flex-col gap-1">
              <span>میزان پیش‌فرض صدا</span>
              <span className="text-sm text-muted-foreground font-normal">
                میزان صدای اولیه برای بازدیدکنندگان
              </span>
            </Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[musicVolume * 100]}
                onValueChange={([v]) => setMusicVolume(v / 100)}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground w-12 text-left">
                {Math.round(musicVolume * 100)}%
              </span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Save Button */}
      <GoldButton
        onClick={handleSave}
        disabled={isSaving}
        className="w-full"
        size="lg"
      >
        {isSaving ? (
          <span className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
            در حال ذخیره...
          </span>
        ) : (
          'ذخیره تنظیمات'
        )}
      </GoldButton>
    </div>
  );
}
