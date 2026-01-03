import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { GoldButton } from './GoldButton';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ 
  message = 'خطایی رخ داده است', 
  onRetry,
  className 
}: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      <div className="glass-card p-8 flex flex-col items-center gap-4">
        <AlertCircle className="h-16 w-16 text-destructive animate-scale-in" />
        <p className="text-lg text-muted-foreground">{message}</p>
        {onRetry && (
          <GoldButton onClick={onRetry} variant="outline" className="mt-4">
            <RefreshCw className="h-4 w-4 ml-2" />
            تلاش مجدد
          </GoldButton>
        )}
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ 
  icon,
  title, 
  description,
  action,
  className 
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      <div className="glass-card p-8 flex flex-col items-center gap-4 animate-fade-in">
        {icon && (
          <div className="text-muted-foreground">
            {icon}
          </div>
        )}
        <h3 className="text-xl font-bold">{title}</h3>
        {description && (
          <p className="text-muted-foreground max-w-md">{description}</p>
        )}
        {action && (
          <div className="mt-4">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
