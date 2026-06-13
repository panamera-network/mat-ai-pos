import React from 'react';
import { cn } from '../lib/utils';
import type { LucideIcon } from 'lucide-react';

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string; value: string | number; icon: LucideIcon;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  subtitle?: string; trend?: { value: number; isPositive: boolean; }; loading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color = 'primary', subtitle, trend, loading, className, ...props }) => {
  const colors = {
    primary: 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400',
    success: 'bg-success-50 text-success-600 dark:bg-success-900/20 dark:text-success-400',
    warning: 'bg-warning-50 text-warning-600 dark:bg-warning-900/20 dark:text-warning-400',
    danger: 'bg-danger-50 text-danger-600 dark:bg-danger-900/20 dark:text-danger-400',
    info: 'bg-info-50 text-info-600 dark:bg-info-900/20 dark:text-info-400',
  };

  return (
    <div className={cn('card p-4 md:p-5', className)} {...props}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          {loading ? <div className="h-8 w-24 skeleton mt-1" /> : <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>}
          {subtitle && !loading && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
          {trend && !loading && (
            <div className={cn('flex items-center gap-1 mt-2 text-xs font-medium', trend.isPositive ? 'text-success-600' : 'text-danger-600')}>
              <span>{trend.isPositive ? '↑' : '↓'}</span><span>{Math.abs(trend.value)}%</span><span className="text-gray-400 font-normal">vs last period</span>
            </div>
          )}
        </div>
        <div className={cn('p-2.5 rounded-xl', colors[color])}><Icon className="w-5 h-5" /></div>
      </div>
    </div>
  );
};