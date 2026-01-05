import React from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Users, Building2, BookOpen } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
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
        className="p-8 md:p-10 xl:p-12 2xl:p-14 h-full flex flex-col items-center justify-center text-center min-h-[200px] md:min-h-[280px] xl:min-h-[320px] 2xl:min-h-[380px] transition-all duration-300 group-hover:border-primary/40 group-active:scale-[0.98]"
      >
        <div className="mb-6 p-4 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
          {icon}
        </div>
        <h2 className="text-2xl md:text-3xl xl:text-4xl 2xl:text-5xl font-bold mb-3 text-foreground group-hover:text-gold transition-all">
          {title}
        </h2>
        <p className="text-muted-foreground text-base md:text-lg xl:text-xl 2xl:text-2xl">
          {description}
        </p>
      </GlassCard>
    </button>
  );
}

export default function MuseumHomePage() {
  useKioskMode();
  const navigate = useNavigate();

  const menuItems = [
    {
      title: 'تاریخچه',
      icon: <History className="h-10 w-10 md:h-12 md:w-12 xl:h-14 xl:w-14 2xl:h-16 2xl:w-16" />,
      description: 'سفر در تاریخ کشتی ایران',
      path: '/history',
    },
    {
      title: 'کشتی‌گیران',
      icon: <Users className="h-10 w-10 md:h-12 md:w-12 xl:h-14 xl:w-14 2xl:h-16 2xl:w-16" />,
      description: 'پهلوانان و قهرمانان',
      path: '/wrestlers',
    },
    {
      title: 'بناها و اماکن',
      icon: <Building2 className="h-10 w-10 md:h-12 md:w-12 xl:h-14 xl:w-14 2xl:h-16 2xl:w-16" />,
      description: 'مکان‌های تاریخی کشتی',
      path: '/buildings',
    },
    {
      title: 'تألیفات',
      icon: <BookOpen className="h-10 w-10 md:h-12 md:w-12 xl:h-14 xl:w-14 2xl:h-16 2xl:w-16" />,
      description: 'کتاب‌ها و آثار مکتوب',
      path: '/books',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 md:p-8 xl:p-12">
      {/* Logo & Title */}
      <header className="text-center mb-12 md:mb-16 xl:mb-20 animate-fade-in">
        <div className="flex items-center justify-center gap-4 md:gap-6 mb-4 md:mb-6">
          <img 
            src={logo} 
            alt="لوگو موزه کشتی ایران" 
            className="h-20 md:h-28 xl:h-32 2xl:h-40"
          />
          <h1 className="text-4xl md:text-6xl xl:text-7xl 2xl:text-8xl font-bold">
            <span className="text-gold">موزه کشتی</span>
            <span className="text-foreground"> ایران</span>
          </h1>
        </div>
        <p className="text-lg md:text-2xl xl:text-3xl 2xl:text-4xl text-muted-foreground">
          میراث پهلوانی و افتخار ملی
        </p>
      </header>

      {/* 4 Cards Grid */}
      <main className="w-full max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px]">
        <div className="grid grid-cols-2 gap-4 md:gap-6 xl:gap-8 2xl:gap-10">
          {menuItems.map((item, index) => (
            <MenuCard
              key={item.path}
              title={item.title}
              icon={item.icon}
              description={item.description}
              onClick={() => navigate(item.path)}
              delay={100 + index * 80}
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
    </div>
  );
}
