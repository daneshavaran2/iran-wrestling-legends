import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, UserPlus } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassInput } from '@/components/ui/GlassInput';
import { GoldButton } from '@/components/ui/GoldButton';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminSignupPage() {
  const navigate = useNavigate();
  const { signUp, isLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('لطفاً همه فیلدها را پر کنید');
      return;
    }

    if (password.length < 6) {
      setError('رمز عبور باید حداقل ۶ کاراکتر باشد');
      return;
    }

    if (password !== confirmPassword) {
      setError('رمز عبور و تکرار آن یکسان نیستند');
      return;
    }

    const { error: signUpError } = await signUp(email, password);
    
    if (signUpError) {
      setError(signUpError.message);
    } else {
      navigate('/admin/setup');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            <span className="text-gold">ثبت‌نام</span>
          </h1>
          <p className="text-muted-foreground">
            ایجاد حساب کاربری جدید
          </p>
        </div>

        {/* Signup Form */}
        <GlassCard className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">
                ایمیل
              </label>
              <GlassInput
                type="email"
                icon={<Mail className="h-5 w-5" />}
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                dir="ltr"
                className="text-left"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">
                رمز عبور
              </label>
              <div className="relative">
                <GlassInput
                  type={showPassword ? 'text' : 'password'}
                  icon={<Lock className="h-5 w-5" />}
                  placeholder="حداقل ۶ کاراکتر"
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
                placeholder="رمز عبور را دوباره وارد کنید"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                dir="ltr"
                className="text-left"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <GoldButton
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <>
                  <UserPlus className="h-5 w-5" />
                  ثبت‌نام
                </>
              )}
            </GoldButton>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            قبلاً ثبت‌نام کرده‌اید؟{' '}
            <button
              onClick={() => navigate('/admin/login')}
              className="text-primary hover:underline"
            >
              وارد شوید
            </button>
          </div>
        </GlassCard>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            بازگشت به صفحه اصلی
          </button>
        </div>
      </div>
    </div>
  );
}
