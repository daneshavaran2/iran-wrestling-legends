import React, { useState, useEffect } from 'react';
import { 
  Settings2, 
  HardDrive, 
  Languages, 
  Volume2, 
  RefreshCw, 
  Trash2, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Database,
  Mic
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { useOfflineTest } from '@/hooks/useOfflineTest';
import { toast } from 'sonner';
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
} from "@/components/ui/alert-dialog";

export default function AdminGeneralSettingsPage() {
  const { result, isRunning, runTest } = useOfflineTest();
  const [isClearing, setIsClearing] = useState(false);
  const [translationStats, setTranslationStats] = useState({ count: 0, size: '0 KB' });
  const [ttsSupported, setTtsSupported] = useState(false);
  const [ttsVoices, setTtsVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    // Check TTS support
    if ('speechSynthesis' in window) {
      setTtsSupported(true);
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setTtsVoices(voices.filter(v => v.lang.startsWith('fa') || v.lang.startsWith('en') || v.lang.startsWith('ar')));
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    // Calculate translation cache stats
    let count = 0;
    let size = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('translation_')) {
        count++;
        size += localStorage.getItem(key)?.length || 0;
      }
    }
    setTranslationStats({ 
      count, 
      size: size > 1024 ? `${(size / 1024).toFixed(1)} KB` : `${size} B` 
    });
  }, []);

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
      }
      localStorage.removeItem('offlineData');
      localStorage.removeItem('offlineLastUpdate');
      
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
      }
      
      toast.success('کش با موفقیت پاک شد');
      runTest();
    } catch (error) {
      toast.error('خطا در پاک کردن کش');
    } finally {
      setIsClearing(false);
    }
  };

  const handleClearTranslationCache = () => {
    let count = 0;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('translation_')) {
        keysToRemove.push(key);
        count++;
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    setTranslationStats({ count: 0, size: '0 B' });
    toast.success(`${count} ترجمه از کش پاک شد`);
  };

  const handleTestTTS = () => {
    if (!ttsSupported) {
      toast.error('مرورگر شما از Text-to-Speech پشتیبانی نمی‌کند');
      return;
    }
    const utterance = new SpeechSynthesisUtterance('این یک تست صدای فارسی است');
    utterance.lang = 'fa-IR';
    window.speechSynthesis.speak(utterance);
    toast.success('در حال پخش تست صدا...');
  };

  const getStatusIcon = (status?: 'success' | 'error' | 'pending' | 'complete' | 'partial' | 'empty') => {
    switch (status) {
      case 'success':
      case 'complete':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
      case 'empty':
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary flex items-center gap-3 mb-2">
          <Settings2 className="h-8 w-8" />
          تنظیمات عمومی
        </h1>
        <p className="text-muted-foreground">
          مدیریت تنظیمات کش، ترجمه و قابلیت‌های صوتی
        </p>
      </div>

      {/* Cache Settings Section */}
      <GlassCard className="p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-primary" />
          تنظیمات کش
        </h2>

        <div className="space-y-4">
          {/* Service Worker Status */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
            <div className="flex items-center gap-3">
              {getStatusIcon(result?.serviceWorkerStatus === 'active' ? 'success' : 'pending')}
              <div>
                <p className="font-medium">Service Worker</p>
                <p className="text-sm text-muted-foreground">
                  {result?.serviceWorkerStatus === 'active' ? 'فعال' : result?.serviceWorkerStatus || 'غیرفعال'}
                </p>
              </div>
            </div>
          </div>

          {/* Offline Ready Status */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
            <div className="flex items-center gap-3">
              {getStatusIcon(result?.isFullyOfflineReady ? 'success' : 'pending')}
              <div>
                <p className="font-medium">آماده آفلاین</p>
                <p className="text-sm text-muted-foreground">
                  {result?.isFullyOfflineReady ? 'بله' : 'خیر'}
                </p>
              </div>
            </div>
          </div>

          {/* Cache Size */}
          {result?.totalCacheSize && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">حجم کش</p>
                  <p className="text-sm text-muted-foreground">{result.totalCacheSize}</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button 
              onClick={() => runTest()} 
              disabled={isRunning}
              variant="outline"
              className="flex-1"
            >
              <RefreshCw className={`h-4 w-4 ml-2 ${isRunning ? 'animate-spin' : ''}`} />
              به‌روزرسانی
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  disabled={isClearing}
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 ml-2" />
                  پاک کردن کش
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>پاک کردن کش؟</AlertDialogTitle>
                  <AlertDialogDescription>
                    تمام داده‌های کش شده حذف می‌شوند. برای استفاده آفلاین باید دوباره دانلود کنید.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>انصراف</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearCache}>
                    پاک کردن
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </GlassCard>

      {/* Translation Settings Section */}
      <GlassCard className="p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Languages className="h-5 w-5 text-primary" />
          تنظیمات ترجمه
        </h2>

        <div className="space-y-4">
          {/* Translation Cache Stats */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">کش ترجمه‌ها (LocalStorage)</p>
                <p className="text-sm text-muted-foreground">
                  {translationStats.count} ترجمه • {translationStats.size}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
            <p className="text-sm text-muted-foreground">
              <strong>سیستم چهار لایه‌ای:</strong> Memory → LocalStorage → Database → AI
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              ترجمه‌ها به صورت اشتراکی بین همه کاربران در دیتابیس ذخیره می‌شوند.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="flex-1">
                  <Trash2 className="h-4 w-4 ml-2" />
                  پاک کردن کش محلی
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>پاک کردن کش ترجمه‌ها؟</AlertDialogTitle>
                  <AlertDialogDescription>
                    ترجمه‌های ذخیره‌شده در مرورگر حذف می‌شوند. ترجمه‌های دیتابیس باقی می‌مانند.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>انصراف</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearTranslationCache}>
                    پاک کردن
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </GlassCard>

      {/* TTS Settings Section */}
      <GlassCard className="p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-primary" />
          تنظیمات Text-to-Speech
        </h2>

        <div className="space-y-4">
          {/* TTS Support Status */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
            <div className="flex items-center gap-3">
              {ttsSupported ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              <div>
                <p className="font-medium">پشتیبانی مرورگر</p>
                <p className="text-sm text-muted-foreground">
                  {ttsSupported ? 'Web Speech API فعال است' : 'پشتیبانی نمی‌شود'}
                </p>
              </div>
            </div>
          </div>

          {/* Available Voices */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
            <div className="flex items-center gap-3">
              <Mic className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">صداهای موجود</p>
                <p className="text-sm text-muted-foreground">
                  {ttsVoices.length > 0 
                    ? `${ttsVoices.length} صدا (فارسی، انگلیسی، عربی)` 
                    : 'هیچ صدایی یافت نشد'}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button 
              onClick={handleTestTTS}
              disabled={!ttsSupported}
              variant="outline"
              className="flex-1"
            >
              <Volume2 className="h-4 w-4 ml-2" />
              تست صدا
            </Button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
