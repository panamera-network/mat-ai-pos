import React from 'react';
import { cn } from '../lib/utils';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string; description?: string; size?: 'sm' | 'md' | 'lg';
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, description, size = 'md', ...props }, ref) => {
    const sizes = { sm: { track: 'w-8 h-5', thumb: 'w-3 h-3', translate: 'translate-x-3' }, md: { track: 'w-11 h-6', thumb: 'w-4 h-4', translate: 'translate-x-5' }, lg: { track: 'w-14 h-8', thumb: 'w-6 h-6', translate: 'translate-x-6' } };
    const s = sizes[size];

    return (
      <label className={cn('flex items-center gap-3 cursor-pointer', className)}>
        <div className="relative">
          <input ref={ref} type="checkbox" className="sr-only peer" {...props} />
          <div className={cn(s.track, 'rounded-full transition-colors duration-200 bg-gray-200 dark:bg-gray-700 peer-checked:bg-primary-600 peer-focus:ring-2 peer-focus:ring-primary-500/30')} />
          <div className={cn(s.thumb, 'absolute top-1/2 left-0.5 -translate-y-1/2 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:' + s.translate)} />
        </div>
        {(label || description) && (
          <div className="flex flex-col">
            {label && <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>}
            {description && <span className="text-xs text-gray-500 dark:text-gray-400">{description}</span>}
          </div>
        )}
      </label>
    );
  }
);
Switch.displayName = 'Switch';