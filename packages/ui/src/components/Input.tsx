import React from 'react';
import { cn } from '../lib/utils';
import { AlertCircle } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helper, leftIcon, rightIcon, fullWidth, ...props }, ref) => {
    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}{props.required && <span className="text-danger-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{leftIcon}</div>}
          <input ref={ref} className={cn('input', leftIcon && 'pl-10', rightIcon && 'pr-10', error && 'border-danger-300 focus:border-danger-500 focus:ring-danger-500/20', className)} {...props} />
          {rightIcon && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{rightIcon}</div>}
        </div>
        {error && <div className="flex items-center gap-1 text-danger-600 text-xs mt-0.5"><AlertCircle className="w-3.5 h-3.5" />{error}</div>}
        {helper && !error && <p className="text-xs text-gray-500 dark:text-gray-400">{helper}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';