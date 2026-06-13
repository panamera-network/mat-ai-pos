import React from 'react';
import { cn } from '../lib/utils';
import type { MenuItem } from '@mat-ai/types';

export interface MenuItemCardProps extends React.HTMLAttributes<HTMLButtonElement> {
  item: MenuItem; showImage?: boolean; compact?: boolean;
}

export const MenuItemCard = React.forwardRef<HTMLButtonElement, MenuItemCardProps>(
  ({ item, showImage = false, compact = false, className, ...props }, ref) => {
    const isOutOfStock = item.stock <= 0;
    const isLowStock = item.stock > 0 && item.stock <= item.minStock;

    return (
      <button ref={ref} disabled={isOutOfStock || !item.isAvailable} className={cn('relative flex flex-col items-center text-center transition-all duration-200 rounded-2xl border-2 hover:shadow-soft-lg active:scale-95', compact ? 'p-3' : 'p-4', isOutOfStock || !item.isAvailable ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50 dark:bg-gray-800' : 'border-gray-200 bg-white hover:border-primary-400 dark:bg-gray-900 dark:border-gray-800 dark:hover:border-primary-700', className)} {...props}>
        {(isOutOfStock || isLowStock) && (
          <div className={cn('absolute top-2 right-2 px-2 py-0.5 rounded-full text-2xs font-bold', isOutOfStock ? 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400' : 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400')}>
            {isOutOfStock ? 'SOLD OUT' : 'LOW'}
          </div>
        )}
        {showImage && item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className={cn('rounded-xl object-cover mb-3', compact ? 'w-16 h-16' : 'w-20 h-20')} />
        ) : (
          <div className={cn('text-4xl mb-2', compact && 'text-3xl mb-1')}>🍽️</div>
        )}
        <p className={cn('font-medium text-gray-900 dark:text-gray-100 leading-tight line-clamp-2', compact ? 'text-xs' : 'text-sm')}>{item.name}</p>
        <p className={cn('font-bold text-primary-600 dark:text-primary-400 mt-1', compact ? 'text-sm' : 'text-lg')}>RM{item.price.toFixed(2)}</p>
        {item.options && item.options.length > 0 && item.isAvailable && !isOutOfStock && <span className="text-2xs text-gray-400 mt-1">+ options</span>}
      </button>
    );
  }
);
MenuItemCard.displayName = 'MenuItemCard';