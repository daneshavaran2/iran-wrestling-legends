import { useState, useEffect } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Smartphone, Monitor, Share, MoreVertical, PlusSquare, Download, CheckCircle2, Apple, Chrome, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';

interface InstallStep {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const InstallGuidePage = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [platform, setPlatform] = useState<'android' | 'ios' | 'windows'>('android');
  const [currentStep, setCurrentStep] = useState(0);

  const androidSteps: InstallStep[] = [
    {
      icon: <MoreVertical className="h-16 w-16" />,
      title: t('installGuide.androidSteps.step1Title'),
      description: t('installGuide.androidSteps.step1Desc'),
    },
    {
      icon: <PlusSquare className="h-16 w-16" />,
      title: t('installGuide.androidSteps.step2Title'),
      description: t('installGuide.androidSteps.step2Desc'),
    },
    {
      icon: <Download className="h-16 w-16" />,
      title: t('installGuide.androidSteps.step3Title'),
      description: t('installGuide.androidSteps.step3Desc'),
    },
  ];

  const iosSteps: InstallStep[] = [
    {
      icon: <Share className="h-16 w-16" />,
      title: t('installGuide.iosSteps.step1Title'),
      description: t('installGuide.iosSteps.step1Desc'),
    },
    {
      icon: <PlusSquare className="h-16 w-16" />,
      title: t('installGuide.iosSteps.step2Title'),
      description: t('installGuide.iosSteps.step2Desc'),
    },
    {
      icon: <Download className="h-16 w-16" />,
      title: t('installGuide.iosSteps.step3Title'),
      description: t('installGuide.iosSteps.step3Desc'),
    },
  ];

  const windowsSteps: InstallStep[] = [
    {
      icon: <Globe className="h-16 w-16" />,
      title: t('installGuide.windowsSteps.step1Title'),
      description: t('installGuide.windowsSteps.step1Desc'),
    },
    {
      icon: <MoreVertical className="h-16 w-16" />,
      title: t('installGuide.windowsSteps.step2Title'),
      description: t('installGuide.windowsSteps.step2Desc'),
    },
    {
      icon: <Download className="h-16 w-16" />,
      title: t('installGuide.windowsSteps.step3Title'),
      description: t('installGuide.windowsSteps.step3Desc'),
    },
  ];

  useEffect(() => {
    // Auto-detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    } else if (/windows/.test(userAgent)) {
      setPlatform('windows');
    }
  }, []);

  const getSteps = () => {
    switch (platform) {
      case 'ios':
        return iosSteps;
      case 'windows':
        return windowsSteps;
      default:
        return androidSteps;
    }
  };

  const steps = getSteps();

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePlatformChange = (value: string) => {
    setPlatform(value as 'android' | 'ios' | 'windows');
    setCurrentStep(0);
  };

  const formatStepNumber = (num: number) => {
    if (language === 'fa') {
      return num.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
    }
    if (language === 'ar') {
      return num.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
    }
    return num.toString();
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
          <h1 className="text-xl font-bold">{t('installGuide.title')}</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Platform Tabs */}
        <Tabs value={platform} onValueChange={handlePlatformChange} className="mb-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="android" className="gap-2">
              <Smartphone className="h-4 w-4" />
              {t('installGuide.android')}
            </TabsTrigger>
            <TabsTrigger value="ios" className="gap-2">
              <Apple className="h-4 w-4" />
              {t('installGuide.ios')}
            </TabsTrigger>
            <TabsTrigger value="windows" className="gap-2">
              <Monitor className="h-4 w-4" />
              {t('installGuide.windows')}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentStep
                  ? 'bg-primary w-6'
                  : index < currentStep
                  ? 'bg-primary/50'
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Current Step Card */}
        <GlassCard className="p-8 mb-6">
          <div className="text-center">
            <div className="text-muted-foreground text-sm mb-2">
              {t('installGuide.stepOf')
                .replace('{current}', formatStepNumber(currentStep + 1))
                .replace('{total}', formatStepNumber(steps.length))}
            </div>
            
            <div className="flex justify-center mb-6">
              <div className="p-6 rounded-full bg-primary/20 text-primary">
                {steps[currentStep].icon}
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-3">{steps[currentStep].title}</h2>
            <p className="text-muted-foreground text-lg">{steps[currentStep].description}</p>
          </div>
        </GlassCard>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ChevronRight className="h-4 w-4" />
            {t('installGuide.prev')}
          </Button>

          {currentStep === steps.length - 1 ? (
            <Button onClick={() => navigate('/install')} className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {t('installGuide.goToInstall')}
            </Button>
          ) : (
            <Button onClick={nextStep} className="gap-2">
              {t('installGuide.next')}
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* iOS Safari Warning */}
        {platform === 'ios' && (
          <GlassCard className="p-4 mb-6 bg-amber-500/10 border-amber-500/30">
            <div className="flex items-start gap-3">
              <Apple className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <p className="text-amber-500 font-medium">{t('installGuide.iosWarning')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('installGuide.iosWarningDesc')}
                </p>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Benefits */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            {t('installGuide.benefits')}
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <span>{t('installGuide.benefitsList.item1')}</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <span>{t('installGuide.benefitsList.item2')}</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <span>{t('installGuide.benefitsList.item3')}</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <span>{t('installGuide.benefitsList.item4')}</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <span>{t('installGuide.benefitsList.item5')}</span>
            </li>
          </ul>
        </GlassCard>
      </main>
    </div>
  );
};

export default InstallGuidePage;
