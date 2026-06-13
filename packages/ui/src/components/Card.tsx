import React from 'react';
import { cn } from '../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'glass' | 'outline';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  noShadow?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', noShadow, children, ...props }, ref) => {
    const variants = {
      default: 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800',
      interactive: 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 cursor-pointer active:scale-[0.98] hover:border-primary-300 dark:hover:border-primary-700',
      glass: 'glass',
      outline: 'border-2 border-dashed border-gray-300 dark:border-gray-700 bg-transparent',
    };
    const paddings = { none: '', sm: 'p-3', md: 'p-4 md:p-6', lg: 'p-6 md:p-8', xl: 'p-8 md:p-10' };

    return (
      <div ref={ref} className={cn('rounded-2xl transition-all duration-200', variants[variant], paddings[padding], !noShadow && variant !== 'glass' && 'shadow-soft', !noShadow && variant === 'interactive' && 'hover:shadow-soft-lg', className)} {...props}>
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

export const CardHeader = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-start justify-between gap-4 mb-4', className)} {...props}>{children}</div>
);
export const CardTitle = ({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn('text-lg font-bold text-gray-900 dark:text-gray-100', className)} {...props}>{children}</h3>
);
export const CardDescription = ({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn('text-sm text-gray-500 dark:text-gray-400', className)} {...props}>{children}</p>
);
export const CardContent = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('', className)} {...props}>{children}</div>
);
export const CardFooter = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center justify-end gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800', className)} {...props}>{children}</div>
);