import React from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Users, Building2, BookOpen, Images, Info, Settings } from 'lucide-react';
import { ParallaxCard } from '@/components/ui/ParallaxCard';
import { SparkParticles } from '@/components/ui/SparkParticles';
import { useKioskMode } from '@/hooks/useKioskMode';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ChatAssistant } from '@/components/ChatAssistant';
import federationLogo from '@/assets/federation-logo.png';

interface MenuCardProps {
  title: string;
  icon: React.ReactNode;
  description: string;
  onClick: () => void;
  delay: number;
}

function MenuCard({ title, icon, description, onClick, delay }: MenuCardProps) {
  return (
    <ParallaxCard
      onClick={onClick}
      intensity={10}
      className="w-full text-right focus:outline-none page-slide-up"
    >
      <div 
        className="cyber-glass cyber-hud rounded-3xl p-5 md:p-6 xl:p-8 2xl:p-10 h-full flex flex-col items-center justify-center text-center min-h-[160px] md:min-h-[200px] xl:min-h-[260px] 2xl:min-h-[300px] group active:scale-[0.98] transition-transform"
        style={{ animationDelay: `${delay}s` }}
      >
        <div className="mb-3 md:mb-4 p-4 md:p-5 xl:p-6 rounded-2xl cyber-glass text-primary group-hover:text-foreground group-hover:bg-primary/30 transition-all duration-300">
          {icon}
        </div>
        <h2 className="text-lg md:text-xl xl:text-2xl 2xl:text-3xl font-bold mb-2 text-foreground group-hover:text-primary transition-all duration-300">
          {title}
        </h2>
        <p className="text-muted-foreground text-sm md:text-base xl:text-lg 2xl:text-xl">
          {description}
        </p>
      </div>
    </ParallaxCard>
  );
}

export default function MuseumHomePage() {
  useKioskMode();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const menuItems = [
    {
      title: t('home.menuHistory'),
      icon: <History className="h-10 w-10 md:h-12 md:w-12 xl:h-16 xl:w-16 2xl:h-20 2xl:w-20" />,
      description: t('home.menuHistoryDesc'),
      path: '/history',
    },
    {
      title: t('home.menuWrestlers'),
      icon: <Users className="h-10 w-10 md:h-12 md:w-12 xl:h-16 xl:w-16 2xl:h-20 2xl:w-20" />,
      description: t('home.menuWrestlersDesc'),
      path: '/wrestlers',
    },
    {
      title: t('home.menuBuildings'),
      icon: <Building2 className="h-10 w-10 md:h-12 md:w-12 xl:h-16 xl:w-16 2xl:h-20 2xl:w-20" />,
      description: t('home.menuBuildingsDesc'),
      path: '/buildings',
    },
    {
      title: t('home.menuBooks'),
      icon: <BookOpen className="h-10 w-10 md:h-12 md:w-12 xl:h-16 xl:w-16 2xl:h-20 2xl:w-20" />,
      description: t('home.menuBooksDesc'),
      path: '/books',
    },
    {
      title: t('home.menuAlbums'),
      icon: <Images className="h-10 w-10 md:h-12 md:w-12 xl:h-16 xl:w-16 2xl:h-20 2xl:w-20" />,
      description: t('home.menuAlbumsDesc'),
      path: '/albums',
    },
    {
      title: t('home.menuAbout'),
      icon: <Info className="h-10 w-10 md:h-12 md:w-12 xl:h-16 xl:w-16 2xl:h-20 2xl:w-20" />,
      description: t('home.menuAboutDesc'),
      path: '/about',
    },
  ];

  return (
    <div className="h-screen flex flex-col items-center justify-center p-3 md:p-4 xl:p-6 overflow-hidden page-enter relative">
      {/* Spark Particles Background */}
      <SparkParticles count={20} />

      {/* Language Selector - Fixed Top */}
      <div className="fixed top-4 left-4 z-50">
        <LanguageSelector />
      </div>

      {/* Logo & Title - Optimized for 55-inch Kiosk */}
      <header className="text-center mb-6 md:mb-8 xl:mb-10 2xl:mb-12 flex-shrink-0 page-slide-up relative z-10" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center justify-center gap-4 md:gap-6 xl:gap-8 2xl:gap-10 mb-2 md:mb-3">
          {/* Right Logo */}
          <img 
            src={federationLogo} 
            alt="لوگو فدراسیون کشتی" 
            className="h-16 md:h-20 xl:h-28 2xl:h-36 object-contain drop-shadow-[0_0_20px_hsl(20_100%_50%/0.3)]"
          />
          
          {/* Title */}
          <h1 className="text-3xl md:text-5xl xl:text-6xl 2xl:text-7xl font-bold">
            <span className="text-neon neon-glow">{t('home.title').split(' ').slice(0, 2).join(' ')}</span>
            <span className="text-foreground"> {t('home.title').split(' ').slice(2).join(' ')}</span>
          </h1>
          
          {/* Left Logo */}
          <img 
            src={federationLogo} 
            alt="لوگو فدراسیون کشتی" 
            className="h-16 md:h-20 xl:h-28 2xl:h-36 object-contain drop-shadow-[0_0_20px_hsl(20_100%_50%/0.3)]"
          />
        </div>
        <p className="text-base md:text-xl xl:text-2xl 2xl:text-3xl text-muted-foreground">
          {t('home.subtitle')}
        </p>
      </header>

      {/* 6 Cards Grid - Responsive for Kiosk */}
      <main className="w-full flex-1 flex items-center justify-center relative z-10">
        <div className="kiosk-menu-grid grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 xl:gap-5 w-full max-w-4xl xl:max-w-5xl 2xl:max-w-6xl">
          {menuItems.map((item, index) => (
            <MenuCard
              key={item.path}
              title={item.title}
              icon={item.icon}
              description={item.description}
              onClick={() => navigate(item.path)}
              delay={0.15 + index * 0.08}
            />
          ))}
        </div>
      </main>

      {/* Admin Button (visible floating button) */}
      <button
        onClick={() => navigate('/admin/login')}
        className="fixed bottom-6 left-6 p-4 floating-icon-glass text-muted-foreground hover:text-primary z-50"
        title="ورود مدیران"
      >
        <Settings className="h-6 w-6" />
      </button>

      {/* Chat Assistant */}
      <ChatAssistant />
    </div>
  );
}
