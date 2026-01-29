import { Link } from "react-router-dom";
import { GlassCard } from "@/components/ui/GlassCard";
import { GoldButton } from "@/components/ui/GoldButton";
import { Home } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const NotFound = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <GlassCard className="p-12 text-center max-w-md animate-fade-in">
        <h1 className="text-8xl font-bold text-gold mb-4">{t('notFound.code')}</h1>
        <p className="text-xl text-muted-foreground mb-8">
          {t('notFound.message')}
        </p>
        <Link to="/">
          <GoldButton className="flex items-center gap-2 mx-auto">
            <Home className="h-5 w-5" />
            {t('notFound.backToHome')}
          </GoldButton>
        </Link>
      </GlassCard>
    </div>
  );
};

export default NotFound;
