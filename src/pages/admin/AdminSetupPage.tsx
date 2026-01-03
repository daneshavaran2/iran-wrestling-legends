import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Check } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GoldButton } from '@/components/ui/GoldButton';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminSetupPage() {
  const navigate = useNavigate();
  const { user, makeAdmin, hasAnyAdmin, isAdmin } = useAuth();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  React.useEffect(() => {
    // If no user, redirect to login
    if (!user) {
      navigate('/admin/login');
      return;
    }
    
    // If already has admin(s) and user is admin, go to dashboard
    if (hasAnyAdmin && isAdmin) {
      navigate('/admin');
      return;
    }
    
    // If already has admin(s) and user is not admin, show error
    if (hasAnyAdmin && !isAdmin) {
      setError('یک مدیر قبلاً ایجاد شده است. برای دسترسی با مدیر سیستم تماس بگیرید.');
    }
  }, [user, hasAnyAdmin, isAdmin, navigate]);

  const handleMakeAdmin = async () => {
    setIsProcessing(true);
    setError(null);

    const { error: makeAdminError } = await makeAdmin();
    
    if (makeAdminError) {
      setError(makeAdminError.message);
    } else {
      setSuccess(true);
      setTimeout(() => {
        navigate('/admin');
      }, 1500);
    }

    setIsProcessing(false);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
            <Shield className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">
            <span className="text-gold">راه‌اندازی اولیه</span>
          </h1>
          <p className="text-muted-foreground">
            ایجاد اولین حساب مدیر سیستم
          </p>
        </div>

        {/* Setup Card */}
        <GlassCard className="p-8">
          {success ? (
            <div className="text-center py-8 animate-scale-in">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
                <Check className="h-8 w-8 text-green-400" />
              </div>
              <h2 className="text-xl font-bold mb-2">تبریک!</h2>
              <p className="text-muted-foreground">
                حساب مدیر با موفقیت ایجاد شد. در حال انتقال به پنل مدیریت...
              </p>
            </div>
          ) : hasAnyAdmin && !isAdmin ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">{error}</p>
              <GoldButton
                variant="outline"
                onClick={() => navigate('/')}
              >
                بازگشت به صفحه اصلی
              </GoldButton>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  شما اولین کاربر سیستم هستید. با کلیک روی دکمه زیر، حساب شما به عنوان مدیر اصلی سیستم تعیین می‌شود.
                </p>
                <p className="text-sm text-muted-foreground/70">
                  ایمیل: {user.email}
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                  {error}
                </div>
              )}

              <GoldButton
                onClick={handleMakeAdmin}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <>
                    <Shield className="h-5 w-5" />
                    فعال‌سازی مدیریت
                  </>
                )}
              </GoldButton>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
