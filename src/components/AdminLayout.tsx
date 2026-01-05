import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  LogOut, 
  Menu,
  X,
  Home,
  Sun,
  Moon,
  History,
  Building2,
  BookOpen,
  Images,
  Info
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/admin', label: 'داشبورد', icon: LayoutDashboard },
  { path: '/admin/wrestlers', label: 'کشتی‌گیرها', icon: Users },
  { path: '/admin/history', label: 'تاریخچه', icon: History },
  { path: '/admin/buildings', label: 'بناها', icon: Building2 },
  { path: '/admin/books', label: 'کتاب‌ها', icon: BookOpen },
  { path: '/admin/albums', label: 'آلبوم‌ها', icon: Images },
  { path: '/admin/about', label: 'درباره موزه', icon: Info },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside 
        className={cn(
          'fixed top-0 right-0 h-full z-40 transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        <GlassCard className="h-full rounded-none border-l border-border/50">
          <div className="flex flex-col h-full p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              {sidebarOpen && (
                <h1 className="text-xl font-bold text-gold animate-fade-in">
                  پنل مدیریت
                </h1>
              )}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-2">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-240',
                      isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {sidebarOpen && (
                      <span className="animate-fade-in">{item.label}</span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="space-y-2 pt-4 border-t border-border/50">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-240"
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5 flex-shrink-0 text-gold" />
                ) : (
                  <Moon className="h-5 w-5 flex-shrink-0 text-gold" />
                )}
                {sidebarOpen && (
                  <span>{theme === 'dark' ? 'حالت روز' : 'حالت شب'}</span>
                )}
              </button>

              <Link
                to="/"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-240"
              >
                <Home className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && <span>مشاهده سایت</span>}
              </Link>
              
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-all duration-240"
              >
                <LogOut className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && <span>خروج</span>}
              </button>

              {sidebarOpen && user && (
                <div className="px-4 py-2 text-xs text-muted-foreground truncate">
                  {user.email}
                </div>
              )}
            </div>
          </div>
        </GlassCard>
      </aside>

      {/* Main Content */}
      <main 
        className={cn(
          'flex-1 transition-all duration-300',
          sidebarOpen ? 'mr-64' : 'mr-20'
        )}
      >
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
