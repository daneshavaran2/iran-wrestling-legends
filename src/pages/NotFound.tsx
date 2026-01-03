import { Link } from "react-router-dom";
import { GlassCard } from "@/components/ui/GlassCard";
import { GoldButton } from "@/components/ui/GoldButton";
import { Home } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <GlassCard className="p-12 text-center max-w-md animate-fade-in">
        <h1 className="text-8xl font-bold text-gold mb-4">۴۰۴</h1>
        <p className="text-xl text-muted-foreground mb-8">
          صفحه مورد نظر یافت نشد
        </p>
        <Link to="/">
          <GoldButton className="flex items-center gap-2 mx-auto">
            <Home className="h-5 w-5" />
            بازگشت به صفحه اصلی
          </GoldButton>
        </Link>
      </GlassCard>
    </div>
  );
};

export default NotFound;
