import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, KeyRound } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassInput } from '@/components/ui/GlassInput';
import { GoldButton } from '@/components/ui/GoldButton';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { signIn, isLoading, user, hasAnyAdmin } = useAuth();
  const { t } = useLanguage();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // If user is already logged in, check if they need setup
  React.useEffect(() => {
    if (user && !hasAnyAdmin) {
      navigate('/admin/setup');
    } else if (user) {
      navigate('/admin');
    }
  }, [user, hasAnyAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError(t('admin.pleaseEnterCredentials'));
      return;
    }

    const { error: signInError } = await signIn(email, password);
    
    if (signInError) {
      setError(signInError.message);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail) {
      toast.error(t('admin.pleaseEnterEmail'));
      return;
    }

    setIsResetting(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success(t('admin.recoveryLinkSent'));
        setShowForgotPassword(false);
        setResetEmail('');
      }
    } catch (err) {
      toast.error(t('admin.errorSendingRecovery'));
    } finally {
      setIsResetting(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-fade-in">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">
              <span className="text-gold">{t('admin.passwordRecovery')}</span>
            </h1>
            <p className="text-muted-foreground">
              {t('admin.passwordRecoveryDesc')}
            </p>
          </div>

          <GlassCard className="p-8">
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-muted-foreground">
                  {t('admin.email')}
                </label>
                <GlassInput
                  type="email"
                  icon={<Mail className="h-5 w-5" />}
                  placeholder="your@email.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
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
                    {t('admin.sendRecoveryLink')}
                  </>
                )}
              </GoldButton>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setShowForgotPassword(false)}
                className="text-primary hover:underline text-sm"
              >
                {t('admin.backToLogin')}
              </button>
            </div>
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
            <span className="text-gold">{t('admin.panel')}</span>
          </h1>
          <p className="text-muted-foreground">
            {t('admin.museum')}
          </p>
        </div>

        {/* Login Form */}
        <GlassCard className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">
                {t('admin.email')}
              </label>
              <GlassInput
                type="email"
                icon={<Mail className="h-5 w-5" />}
                placeholder="admin@museum.ir"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                dir="ltr"
                className="text-left"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">
                {t('admin.password')}
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

            {/* Forgot Password Link */}
            <div className="text-left">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-primary hover:underline"
              >
                {t('admin.forgotPassword')}
              </button>
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
                  <LogIn className="h-5 w-5" />
                  {t('admin.login')}
                </>
              )}
            </GoldButton>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            {t('admin.noAccount')}{' '}
            <button
              onClick={() => navigate('/admin/signup')}
              className="text-primary hover:underline"
            >
              {t('admin.signup')}
            </button>
          </div>
        </GlassCard>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            {t('admin.backToHome')}
          </button>
        </div>
      </div>
    </div>
  );
}
