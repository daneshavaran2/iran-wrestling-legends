import { useState, useEffect } from 'react';
import { ArrowRight, Download, Smartphone, Monitor, Apple, Chrome, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPage = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isWindows, setIsWindows] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));
    setIsWindows(/windows/.test(userAgent));

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowRight className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-bold">نصب برنامه</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Installed State */}
        {isInstalled ? (
          <GlassCard className="p-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">برنامه نصب شده است!</h2>
            <p className="text-muted-foreground mb-6">
              اکنون می‌توانید از طریق آیکون روی صفحه اصلی به برنامه دسترسی داشته باشید.
            </p>
            <Button onClick={() => navigate('/')} className="bg-primary hover:bg-primary/90">
              بازگشت به صفحه اصلی
            </Button>
          </GlassCard>
        ) : (
          <>
            {/* Install Button (for supported browsers) */}
            {deferredPrompt && (
              <GlassCard className="p-6 mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-full bg-primary/20">
                    <Download className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">نصب سریع</h2>
                    <p className="text-muted-foreground text-sm">
                      با یک کلیک برنامه را نصب کنید
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={handleInstall} 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  size="lg"
                >
                  <Download className="h-5 w-5 ml-2" />
                  نصب برنامه
                </Button>
              </GlassCard>
            )}

            {/* Android Instructions */}
            {isAndroid && (
              <GlassCard className="p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <Smartphone className="h-6 w-6 text-green-500" />
                  <h3 className="text-lg font-bold">نصب در اندروید</h3>
                </div>
                <ol className="space-y-3 text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="bg-primary/20 text-primary rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">۱</span>
                    <span>روی منوی سه‌نقطه مرورگر کلیک کنید</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="bg-primary/20 text-primary rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">۲</span>
                    <span>گزینه "افزودن به صفحه اصلی" یا "Install app" را انتخاب کنید</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="bg-primary/20 text-primary rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">۳</span>
                    <span>روی "نصب" یا "Add" کلیک کنید</span>
                  </li>
                </ol>
              </GlassCard>
            )}

            {/* iOS Instructions */}
            {isIOS && (
              <GlassCard className="p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <Apple className="h-6 w-6 text-gray-400" />
                  <h3 className="text-lg font-bold">نصب در آیفون/آیپد</h3>
                </div>
                <ol className="space-y-3 text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="bg-primary/20 text-primary rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">۱</span>
                    <span>در Safari روی آیکون Share (مربع با فلش) کلیک کنید</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="bg-primary/20 text-primary rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">۲</span>
                    <span>به پایین اسکرول کنید و "Add to Home Screen" را انتخاب کنید</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="bg-primary/20 text-primary rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">۳</span>
                    <span>روی "Add" کلیک کنید</span>
                  </li>
                </ol>
                <p className="mt-4 text-sm text-amber-500 bg-amber-500/10 p-3 rounded-lg">
                  ⚠️ توجه: برای نصب در iOS باید از Safari استفاده کنید
                </p>
              </GlassCard>
            )}

            {/* Windows Instructions */}
            {isWindows && (
              <GlassCard className="p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <Monitor className="h-6 w-6 text-blue-500" />
                  <h3 className="text-lg font-bold">نصب در ویندوز</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Chrome className="h-5 w-5" />
                      <span className="font-medium">Chrome / Edge</span>
                    </div>
                    <ol className="space-y-2 text-muted-foreground pr-7">
                      <li className="flex gap-3">
                        <span className="bg-primary/20 text-primary rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">۱</span>
                        <span>روی آیکون نصب (⊕) در نوار آدرس کلیک کنید</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="bg-primary/20 text-primary rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">۲</span>
                        <span>یا از منو: ⋮ → "Install app" یا "نصب برنامه"</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="bg-primary/20 text-primary rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">۳</span>
                        <span>روی "Install" کلیک کنید</span>
                      </li>
                    </ol>
                  </div>
                </div>
              </GlassCard>
            )}

            {/* General Instructions */}
            {!isAndroid && !isIOS && !isWindows && (
              <GlassCard className="p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <Download className="h-6 w-6 text-primary" />
                  <h3 className="text-lg font-bold">نصب برنامه</h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  برای نصب برنامه، از منوی مرورگر گزینه "Install" یا "Add to Home Screen" را انتخاب کنید.
                </p>
              </GlassCard>
            )}

            {/* Benefits */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-bold mb-4">مزایای نصب برنامه</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>دسترسی سریع از صفحه اصلی</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>کار در حالت آفلاین</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>تجربه کاربری بهتر بدون نوار آدرس</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>بارگذاری سریع‌تر</span>
                </li>
              </ul>
            </GlassCard>
          </>
        )}
      </main>
    </div>
  );
};

export default InstallPage;
