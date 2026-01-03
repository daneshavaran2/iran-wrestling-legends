import React from 'react';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export function GlassInput({ 
  className, 
  icon,
  ...props 
}: GlassInputProps) {
  return (
    <div className="relative w-full">
      {icon && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </div>
      )}
      <input
        className={cn(
          'glass-input',
          icon && 'pr-12',
          className
        )}
        {...props}
      />
    </div>
  );
}

export function SearchInput(props: Omit<GlassInputProps, 'icon'>) {
  return (
    <GlassInput
      icon={<Search className="h-5 w-5" />}
      {...props}
    />
  );
}
