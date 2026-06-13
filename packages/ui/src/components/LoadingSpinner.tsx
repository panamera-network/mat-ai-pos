import React from 'react';
import { cn } from '../lib/utils';

export interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl'; color?: 'primary' | 'white' | 'gray'; label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', color = 'primary', label, className, ...props }) => {
  const sizes = { sm: 'w-4 h-4 border-2', md: 'w-8 h-8 border-3', lg: 'w-12 h-12 border-4', xl: 'w-16 h-16 border-4' };
  const colors = { primary: 'border-primary-600 border-t-transparent', white: 'border-white border-t-transparent', gray: 'border-gray-400 border-t-transparent' };

  return (
    <div className={cn('flex flex-col items-center gap-3', className)} {...props}>
      <div className={cn('rounded-full animate-spin', sizes[size], colors[color])} />
      {label && <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>}
    </div>
  );
};