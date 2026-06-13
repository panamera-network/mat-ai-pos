import React from 'react';
import { cn } from '../lib/utils';

export type StatusType = 'available' | 'occupied' | 'reserved' | 'cleaning' | 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled' | 'paid' | 'active' | 'inactive' | 'online' | 'offline' | 'success' | 'error' | 'warning' | 'info';

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusType; label?: string; size?: 'sm' | 'md' | 'lg'; pulse?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, size = 'md', pulse = false, className, ...props }) => {
  const config: Record<StatusType, { bg: string; text: string; dot: string; defaultLabel: string }> = {
    available: { bg: 'bg-success-100 dark:bg-success-900/20', text: 'text-success-800 dark:text-success-300', dot: 'bg-success-500', defaultLabel: 'Available' },
    occupied: { bg: 'bg-danger-100 dark:bg-danger-900/20', text: 'text-danger-800 dark:text-danger-300', dot: 'bg-danger-500', defaultLabel: 'Occupied' },
    reserved: { bg: 'bg-warning-100 dark:bg-warning-900/20', text: 'text-warning-800 dark:text-warning-300', dot: 'bg-warning-500', defaultLabel: 'Reserved' },
    cleaning: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-400', dot: 'bg-gray-500', defaultLabel: 'Cleaning' },
    pending: { bg: 'bg-warning-100 dark:bg-warning-900/20', text: 'text-warning-800 dark:text-warning-300', dot: 'bg-warning-500', defaultLabel: 'Pending' },
    preparing: { bg: 'bg-primary-100 dark:bg-primary-900/20', text: 'text-primary-800 dark:text-primary-300', dot: 'bg-primary-500', defaultLabel: 'Preparing' },
    ready: { bg: 'bg-info-100 dark:bg-info-900/20', text: 'text-info-800 dark:text-info-300', dot: 'bg-info-500', defaultLabel: 'Ready' },
    served: { bg: 'bg-success-100 dark:bg-success-900/20', text: 'text-success-800 dark:text-success-300', dot: 'bg-success-500', defaultLabel: 'Served' },
    cancelled: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-400', dot: 'bg-gray-500', defaultLabel: 'Cancelled' },
    paid: { bg: 'bg-success-100 dark:bg-success-900/20', text: 'text-success-800 dark:text-success-300', dot: 'bg-success-500', defaultLabel: 'Paid' },
    active: { bg: 'bg-success-100 dark:bg-success-900/20', text: 'text-success-800 dark:text-success-300', dot: 'bg-success-500', defaultLabel: 'Active' },
    inactive: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-400', dot: 'bg-gray-500', defaultLabel: 'Inactive' },
    online: { bg: 'bg-success-100 dark:bg-success-900/20', text: 'text-success-800 dark:text-success-300', dot: 'bg-success-500', defaultLabel: 'Online' },
    offline: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-400', dot: 'bg-gray-500', defaultLabel: 'Offline' },
    success: { bg: 'bg-success-100 dark:bg-success-900/20', text: 'text-success-800 dark:text-success-300', dot: 'bg-success-500', defaultLabel: 'Success' },
    error: { bg: 'bg-danger-100 dark:bg-danger-900/20', text: 'text-danger-800 dark:text-danger-300', dot: 'bg-danger-500', defaultLabel: 'Error' },
    warning: { bg: 'bg-warning-100 dark:bg-warning-900/20', text: 'text-warning-800 dark:text-warning-300', dot: 'bg-warning-500', defaultLabel: 'Warning' },
    info: { bg: 'bg-info-100 dark:bg-info-900/20', text: 'text-info-800 dark:text-info-300', dot: 'bg-info-500', defaultLabel: 'Info' },
  };

  const c = config[status];
  const sizes = { sm: 'px-2 py-0.5 text-2xs gap-1', md: 'px-2.5 py-1 text-xs gap-1.5', lg: 'px-3 py-1.5 text-sm gap-2' };

  return (
    <span className={cn('inline-flex items-center rounded-full font-semibold', c.bg, c.text, sizes[size], className)} {...props}>
      <span className={cn('w-2 h-2 rounded-full', c.dot, pulse && 'animate-pulse')} />
      {label || c.defaultLabel}
    </span>
  );
};