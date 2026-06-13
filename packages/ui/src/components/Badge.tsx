import React from 'react';
import { cn } from '../lib/utils';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant; size?: BadgeSize; dot?: boolean; dotColor?: string;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', dot, dotColor, children, ...props }, ref) => {
    const variants = {
      default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
      success: 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-300',
      warning: 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300',
      danger: 'bg-danger-100 text-danger-800 dark:bg-danger-900/30 dark:text-danger-300',
      info: 'bg-info-100 text-info-800 dark:bg-info-900/30 dark:text-info-300',
      outline: 'border-2 border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300 bg-transparent',
    };
    const sizes = { sm: 'px-2 py-0.5 text-2xs', md: 'px-2.5 py-1 text-xs', lg: 'px-3 py-1.5 text-sm' };

    return (
      <span ref={ref} className={cn('badge', variants[variant], sizes[size], className)} {...props}>
        {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotColor || { default: 'bg-gray-500', primary: 'bg-primary-500', success: 'bg-success-500', warning: 'bg-warning-500', danger: 'bg-danger-500', info: 'bg-info-500', outline: 'bg-gray-500' }[variant])} />}
        {children}
      </span>
    );
  }
);
Badge.displayName = 'Badge';