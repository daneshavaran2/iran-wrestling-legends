import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/ui/GlassCard';
import { LazyImage } from '@/components/ui/LazyImage';
import { Wrestler, wrestlingStyles } from '@/data/wrestlers';

interface WrestlerCardProps {
  wrestler: Wrestler;
  className?: string;
}

export function WrestlerCard({ wrestler, className }: WrestlerCardProps) {
  return (
    <Link to={`/wrestler/${wrestler.id}`}>
      <GlassCard 
        hover 
        className={cn('p-4 cursor-pointer group', className)}
      >
        <div className="relative overflow-hidden rounded-xl mb-4 aspect-[3/4]">
          <LazyImage
            src={wrestler.image_url || undefined}
            alt={wrestler.name}
            className="w-full h-full transition-transform duration-500 group-hover:scale-110"
          />
          {/* Gold overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-foreground group-hover:text-gold transition-colors duration-240">
            {wrestler.name}
          </h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
              {wrestlingStyles[wrestler.style]}
            </span>
            {wrestler.weight_class && (
              <span>{wrestler.weight_class}</span>
            )}
          </div>
          {wrestler.province && (
            <p className="text-sm text-muted-foreground">
              {wrestler.province}
            </p>
          )}
        </div>
      </GlassCard>
    </Link>
  );
}
