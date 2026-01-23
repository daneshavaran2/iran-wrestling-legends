import React, { useEffect, useState } from 'react';
import logoImage from '@/assets/logo.png';

interface SplashScreenProps {
  onComplete: () => void;
  minDisplayTime?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ 
  onComplete, 
  minDisplayTime = 2000 
}) => {
  const [progress, setProgress] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / minDisplayTime) * 100, 100);
      setProgress(newProgress);
      
      if (newProgress >= 100) {
        clearInterval(progressInterval);
      }
    }, 50);

    const timer = setTimeout(() => {
      setIsFading(true);
      setTimeout(onComplete, 500);
    }, minDisplayTime);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [onComplete, minDisplayTime]);

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center
        bg-gradient-to-br from-background via-background to-background
        transition-opacity duration-500 ${isFading ? 'opacity-0' : 'opacity-100'}`}
    >
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-bronze/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-bronze/40 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Logo Container */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo with glow */}
        <div className="relative mb-8 animate-scale-in">
          <div className="absolute inset-0 bg-bronze/30 blur-3xl rounded-full scale-150" />
          <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden
            border-4 border-bronze/50 shadow-2xl shadow-bronze/30
            animate-pulse-glow">
            <img 
              src={logoImage} 
              alt="موزه کشتی ایران" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-bronze bronze-glow mb-2 animate-fade-in"
          style={{ animationDelay: '0.3s' }}>
          موزه افتخارات کشتی ایران
        </h1>
        
        <p className="text-muted-foreground text-sm md:text-base mb-8 animate-fade-in"
          style={{ animationDelay: '0.5s' }}>
          Iran Wrestling Museum
        </p>

        {/* Progress Bar */}
        <div className="w-48 md:w-64 h-1 bg-muted/30 rounded-full overflow-hidden animate-fade-in"
          style={{ animationDelay: '0.7s' }}>
          <div 
            className="h-full bg-gradient-to-r from-bronze via-bronze to-primary rounded-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Loading text */}
        <p className="mt-4 text-xs text-muted-foreground animate-fade-in"
          style={{ animationDelay: '0.9s' }}>
          در حال بارگذاری...
        </p>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          50% { transform: translateY(-20px) translateX(10px); opacity: 0.8; }
        }
        
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(205, 127, 50, 0.3); }
          50% { box-shadow: 0 0 40px rgba(205, 127, 50, 0.6); }
        }
        
        @keyframes scale-in {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        .animate-scale-in { animation: scale-in 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
};
