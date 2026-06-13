import React from 'react';
import { cn } from '../lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'; width?: string | number;
  height?: string | number; animate?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({ variant = 'text', width, height, animate = true, className, ...props }) => {
  const variants = { text: 'rounded-md', circular: 'rounded-full', rectangular: 'rounded-none', rounded: 'rounded-xl' };
  return (
    <div className={cn('bg-gray-200 dark:bg-gray-800', animate && 'animate-pulse', variants[variant], className)}
      style={{ width: typeof width === 'number' ? `${width}px` : width, height: typeof height === 'number' ? `${height}px` : height }}
      {...props}
    />
  );
};

export const SkeletonCard: React.FC = () => (
  <div className="card p-5 space-y-3"><Skeleton variant="circular" width={40} height={40} /><Skeleton width="60%" height={20} /><Skeleton width="40%" height={16} /></div>
);

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 4 }) => (
  <div className="space-y-2">
    <div className="flex gap-2">{Array.from({ length: cols }).map((_, i) => <Skeleton key={i} className="flex-1 h-8" />)}</div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-2">{Array.from({ length: cols }).map((_, j) => <Skeleton key={j} className="flex-1 h-10" variant="rounded" />)}</div>
    ))}
  </div>
);