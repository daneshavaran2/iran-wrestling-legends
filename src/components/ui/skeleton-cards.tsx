import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div className={cn('glass-card p-4 animate-fade-in', className)}>
      {/* Image skeleton */}
      <div className="skeleton aspect-[3/4] w-full rounded-xl mb-4" />
      {/* Title skeleton */}
      <div className="skeleton h-6 w-3/4 rounded mb-2" />
      {/* Subtitle skeleton */}
      <div className="skeleton h-4 w-1/2 rounded" />
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="animate-fade-in">
      {/* Header skeleton */}
      <div className="glass-card p-8 mb-6">
        <div className="flex gap-6">
          <div className="skeleton h-32 w-32 rounded-2xl" />
          <div className="flex-1 space-y-4">
            <div className="skeleton h-8 w-1/2 rounded" />
            <div className="skeleton h-4 w-3/4 rounded" />
            <div className="skeleton h-4 w-1/4 rounded" />
          </div>
        </div>
      </div>
      {/* Content skeleton */}
      <div className="glass-card p-6 space-y-4">
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-5/6 rounded" />
        <div className="skeleton h-4 w-4/5 rounded" />
      </div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="glass-card p-4 animate-fade-in">
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="skeleton h-12 w-12 rounded-lg" />
            <div className="skeleton h-4 flex-1 rounded" />
            <div className="skeleton h-4 w-24 rounded" />
            <div className="skeleton h-8 w-20 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
