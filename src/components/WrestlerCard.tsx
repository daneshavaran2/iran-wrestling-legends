import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LazyImage } from '@/components/ui/LazyImage';
import { Wrestler, wrestlingStyles } from '@/data/wrestlers';

interface WrestlerCardProps {
  wrestler: Wrestler;
  className?: string;
}

export function WrestlerCard({ wrestler, className }: WrestlerCardProps) {
  return (
    <Link to={`/wrestler/${wrestler.id}`}>
      <div 
        className={cn(
          'liquid-glass rounded-3xl p-4 2xl:p-6 cursor-pointer group transition-all duration-400',
          className
        )}
      >
        <div className="relative overflow-hidden rounded-2xl mb-4 2xl:mb-6 aspect-[3/4]">
          <LazyImage
            src={wrestler.image_url || undefined}
            alt={wrestler.name}
            className="w-full h-full transition-transform duration-500 group-hover:scale-110"
          />
          {/* Bronze overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        
        <div className="space-y-2 2xl:space-y-3">
          <h3 className="text-lg 2xl:text-xl font-bold text-foreground group-hover:text-bronze transition-colors duration-300">
            {wrestler.name}
          </h3>
          <div className="flex items-center gap-2 text-sm 2xl:text-base text-muted-foreground">
            <span className="px-3 py-1 rounded-full liquid-glass text-bronze text-xs 2xl:text-sm border border-bronze/20">
              {wrestlingStyles[wrestler.style]}
            </span>
            {wrestler.weight_class && (
              <span>{wrestler.weight_class}</span>
            )}
          </div>
          {wrestler.province && (
            <p className="text-sm 2xl:text-base text-muted-foreground">
              {wrestler.province}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
