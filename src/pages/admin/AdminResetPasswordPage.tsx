import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, KeyRound, CheckCircle } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassInput } from '@/components/ui/GlassInput';
import { GoldButton } from '@/components/ui/GoldButton';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function AdminResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Check if we have the recovery token in the URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');

    if (type === 'recovery' && accessToken) {
      // Set the session with the recovery token
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: hashParams.get('refresh_token') || '',
      });
    }
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error('لطفاً رمز عبور جدید را وارد کنید');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('رمز عبور و تکرار آن مطابقت ندارند');
      return;
    }

    if (password.length < 6) {
      toast.error('رمز عبور باید حداقل ۶ کاراکتر باشد');
      return;
    }

    setIsResetting(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        toast.error(error.message);
      } else {
        setIsSuccess(true);
        toast.success('رمز عبور با موفقیت تغییر کرد');
      }
    } catch (err) {
      toast.error('خطا در تغییر رمز عبور');
    } finally {
      setIsResetting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-fade-in">
          <GlassCard className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-gold mb-2">رمز عبور تغییر کرد</h2>
            <p className="text-muted-foreground mb-6">
              رمز عبور شما با موفقیت به‌روزرسانی شد
            </p>
            <GoldButton
              onClick={() => navigate('/admin/login')}
              className="w-full"
            >
              ورود به پنل مدیریت
            </GoldButton>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            <span className="text-gold">تغییر رمز عبور</span>
          </h1>
          <p className="text-muted-foreground">
            رمز عبور جدید خود را وارد کنید
          </p>
        </div>

        <GlassCard className="p-8">
          <form onSubmit={handleResetPassword} className="space-y-6">
            {/* New Password */}
            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">
                رمز عبور جدید
              </label>
              <div className="relative">
                <GlassInput
                  type={showPassword ? 'text' : 'password'}
                  icon={<Lock className="h-5 w-5" />}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  dir="ltr"
                  className="text-left pl-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">
                تکرار رمز عبور
              </label>
              <GlassInput
                type={showPassword ? 'text' : 'password'}
                icon={<Lock className="h-5 w-5" />}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                dir="ltr"
                className="text-left"
              />
            </div>

            <GoldButton
              type="submit"
              disabled={isResetting}
              className="w-full flex items-center justify-center gap-2"
            >
              {isResetting ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <>
                  <KeyRound className="h-5 w-5" />
                  تغییر رمز عبور
                </>
              )}
            </GoldButton>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/admin/login')}
              className="text-primary hover:underline text-sm"
            >
              بازگشت به صفحه ورود
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
