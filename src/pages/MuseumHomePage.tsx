import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Users, Building2, BookOpen, Images, Info, Search } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GoldButton } from '@/components/ui/GoldButton';
import { GlobalSearch } from '@/components/GlobalSearch';
import { useKioskMode } from '@/hooks/useKioskMode';
import logo from '@/assets/logo.png';

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
      <GlassCard 
        hover 
        className="p-4 md:p-6 xl:p-8 h-full flex flex-col items-center justify-center text-center min-h-[140px] md:min-h-[180px] xl:min-h-[200px] 2xl:min-h-[240px] transition-all duration-300 group-hover:border-primary/40 group-active:scale-[0.98]"
      >
        <div className="mb-3 p-3 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
          {icon}
        </div>
        <h2 className="text-lg md:text-xl xl:text-2xl 2xl:text-3xl font-bold mb-1 text-foreground group-hover:text-gold transition-all">
          {title}
        </h2>
        <p className="text-muted-foreground text-sm md:text-base xl:text-lg 2xl:text-xl">
          {description}
        </p>
      </GlassCard>
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
      description: 'معرفی موزه کشتی ایران',
      path: '/about',
    },
  ];

  return (
    <div className="h-screen flex flex-col items-center justify-center p-4 md:p-6 xl:p-8 overflow-hidden">
      {/* Search Button - Top Right */}
      <div className="fixed top-4 left-4 z-50 animate-fade-in">
        <GoldButton
          variant="ghost"
          size="lg"
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center gap-2"
        >
          <Search className="h-5 w-5" />
          <span className="hidden md:inline">جستجو</span>
        </GoldButton>
      </div>

      {/* Logo & Title */}
      <header className="text-center mb-6 md:mb-8 xl:mb-10 animate-fade-in">
        <div className="flex items-center justify-center gap-3 md:gap-4 mb-2 md:mb-3">
          <img 
            src={logo} 
            alt="لوگو موزه کشتی ایران" 
            className="h-14 md:h-20 xl:h-24 2xl:h-28"
          />
          <h1 className="text-3xl md:text-5xl xl:text-6xl 2xl:text-7xl font-bold">
            <span className="text-gold">موزه کشتی</span>
            <span className="text-foreground"> ایران</span>
          </h1>
        </div>
        <p className="text-base md:text-xl xl:text-2xl 2xl:text-3xl text-muted-foreground">
          میراث پهلوانی و افتخار ملی
        </p>
      </header>

      {/* 6 Cards Grid - 3x2 */}
      <main className="w-full max-w-5xl xl:max-w-6xl 2xl:max-w-7xl">
        <div className="grid grid-cols-3 gap-3 md:gap-4 xl:gap-6">
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
