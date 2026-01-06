import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Users, Building2, BookOpen, Images, Info, Search } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GoldButton } from '@/components/ui/GoldButton';
import { GlobalSearch } from '@/components/GlobalSearch';
import { useKioskMode } from '@/hooks/useKioskMode';
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
    <button
      onClick={onClick}
      className="w-full text-right focus:outline-none group animate-scale-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="bronze-card rounded-2xl p-4 md:p-5 xl:p-6 h-full flex flex-col items-center justify-center text-center min-h-[120px] md:min-h-[160px] xl:min-h-[180px] 2xl:min-h-[200px] transition-all duration-300 group-active:scale-[0.98]">
        <div className="mb-2 md:mb-3 p-2.5 md:p-3 rounded-xl bg-bronze/15 text-bronze group-hover:bg-bronze/25 transition-colors">
          {icon}
        </div>
        <h2 className="text-base md:text-lg xl:text-xl 2xl:text-2xl font-bold mb-1 text-foreground group-hover:text-bronze transition-all">
          {title}
        </h2>
        <p className="text-muted-foreground text-xs md:text-sm xl:text-base">
          {description}
        </p>
      </div>
    </button>
  );
}

export default function MuseumHomePage() {
  useKioskMode();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const menuItems = [
    {
      title: 'تاریخچه',
      icon: <History className="h-8 w-8 md:h-10 md:w-10 xl:h-12 xl:w-12" />,
      description: 'سفر در تاریخ کشتی ایران',
      path: '/history',
    },
    {
      title: 'کشتی‌گیران',
      icon: <Users className="h-8 w-8 md:h-10 md:w-10 xl:h-12 xl:w-12" />,
      description: 'پهلوانان و قهرمانان',
      path: '/wrestlers',
    },
    {
      title: 'بناها و اماکن',
      icon: <Building2 className="h-8 w-8 md:h-10 md:w-10 xl:h-12 xl:w-12" />,
      description: 'مکان‌های تاریخی کشتی',
      path: '/buildings',
    },
    {
      title: 'تألیفات',
      icon: <BookOpen className="h-8 w-8 md:h-10 md:w-10 xl:h-12 xl:w-12" />,
      description: 'کتاب‌ها و آثار مکتوب',
      path: '/books',
    },
    {
      title: 'آلبوم تصاویر',
      icon: <Images className="h-8 w-8 md:h-10 md:w-10 xl:h-12 xl:w-12" />,
      description: 'مجموعه عکس‌های تاریخی',
      path: '/albums',
    },
    {
      title: 'درباره موزه',
      icon: <Info className="h-8 w-8 md:h-10 md:w-10 xl:h-12 xl:w-12" />,
      description: 'معرفی موزه افتخارات کشتی',
      path: '/about',
    },
  ];

  return (
    <div className="h-screen flex flex-col items-center justify-center p-3 md:p-4 xl:p-6 overflow-hidden">
      {/* Search Button - Top Left */}
      <div className="fixed top-3 left-3 z-50 animate-fade-in">
        <GoldButton
          variant="ghost"
          size="sm"
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center gap-2"
        >
          <Search className="h-4 w-4 md:h-5 md:w-5" />
          <span className="hidden md:inline">جستجو</span>
        </GoldButton>
      </div>

      {/* Logo & Title - Compact for kiosk */}
      <header className="text-center mb-4 md:mb-6 xl:mb-8 animate-fade-in flex-shrink-0">
        <div className="flex items-center justify-center gap-3 md:gap-5 xl:gap-6 mb-1 md:mb-2">
          {/* Right Logo */}
          <img 
            src={federationLogo} 
            alt="لوگو فدراسیون کشتی" 
            className="h-12 md:h-16 xl:h-20 2xl:h-24 object-contain"
          />
          
          {/* Title */}
          <h1 className="text-2xl md:text-4xl xl:text-5xl 2xl:text-6xl font-bold">
            <span className="text-bronze bronze-glow">موزه افتخارات</span>
            <span className="text-foreground"> کشتی</span>
          </h1>
          
          {/* Left Logo */}
          <img 
            src={federationLogo} 
            alt="لوگو فدراسیون کشتی" 
            className="h-12 md:h-16 xl:h-20 2xl:h-24 object-contain"
          />
        </div>
        <p className="text-sm md:text-lg xl:text-xl 2xl:text-2xl text-muted-foreground">
          میراث پهلوانی و افتخار ملی
        </p>
      </header>

      {/* 6 Cards Grid - Responsive for Kiosk */}
      <main className="w-full flex-1 flex items-center justify-center">
        <div className="kiosk-menu-grid grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 xl:gap-5 w-full max-w-4xl xl:max-w-5xl 2xl:max-w-6xl">
          {menuItems.map((item, index) => (
            <MenuCard
              key={item.path}
              title={item.title}
              icon={item.icon}
              description={item.description}
              onClick={() => navigate(item.path)}
              delay={100 + index * 60}
            />
          ))}
        </div>
      </main>

      {/* Admin Link (subtle) */}
      <footer className="fixed bottom-4 left-4">
        <a
          href="/admin/login"
          className="text-xs text-muted-foreground/20 hover:text-muted-foreground/60 transition-colors"
        >
          ورود مدیران
        </a>
      </footer>

      {/* Global Search Modal */}
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}
