import React from 'react';
import { cn } from '../lib/utils';
import { Users } from 'lucide-react';
import type { DiningTable, DiningTableStatus } from '@mat-ai/types';

export interface TableCardProps extends React.HTMLAttributes<HTMLButtonElement> {
  table: DiningTable; isSelected?: boolean; orderTotal?: number; showCapacity?: boolean;
}

export const TableCard = React.forwardRef<HTMLButtonElement, TableCardProps>(
  ({ table, isSelected, orderTotal, showCapacity = true, className, ...props }, ref) => {
    const statusColors: Record<DiningTableStatus, string> = {
      AVAILABLE: 'border-success-200 bg-success-50 text-success-800 hover:bg-success-100 hover:border-success-400 dark:bg-success-900/20 dark:border-success-800 dark:text-success-300',
      OCCUPIED: 'border-danger-200 bg-danger-50 text-danger-800 hover:bg-danger-100 hover:border-danger-400 dark:bg-danger-900/20 dark:border-danger-800 dark:text-danger-300',
      RESERVED: 'border-warning-200 bg-warning-50 text-warning-800 hover:bg-warning-100 hover:border-warning-400 dark:bg-warning-900/20 dark:border-warning-800 dark:text-warning-300',
      CLEANING: 'border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400',
    };
    const statusDot: Record<DiningTableStatus, string> = {
      AVAILABLE: 'bg-success-500', OCCUPIED: 'bg-danger-500', RESERVED: 'bg-warning-500', CLEANING: 'bg-gray-500',
    };

    return (
      <button ref={ref} className={cn('relative p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all duration-200 hover:scale-105 active:scale-95', statusColors[table.status], isSelected && 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-gray-900', className)} {...props}>
        <div className={cn('absolute top-2 right-2 w-2.5 h-2.5 rounded-full', statusDot[table.status])} />
        <span className="text-2xl font-bold">{table.number}</span>
        {showCapacity && <div className="flex items-center gap-1 text-xs opacity-70"><Users className="w-3 h-3" /><span>{table.capacity}</span></div>}
        {orderTotal !== undefined && orderTotal > 0 && <span className="text-sm font-semibold mt-1">RM{orderTotal.toFixed(2)}</span>}
        <span className="text-2xs uppercase tracking-wider opacity-60 font-medium">{table.status.toLowerCase()}</span>
      </button>
    );
  }
);
TableCard.displayName = 'TableCard';