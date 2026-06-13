import React from 'react';
import { cn } from '../lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectOption { value: string; label: string; disabled?: boolean; }

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string; error?: string; helper?: string; options: SelectOption[];
  placeholder?: string; fullWidth?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helper, options, placeholder, fullWidth, ...props }, ref) => {
    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}{props.required && <span className="text-danger-500 ml-0.5">*</span>}</label>}
        <div className="relative">
          <select ref={ref} className={cn('input appearance-none pr-10', error && 'border-danger-300 focus:border-danger-500 focus:ring-danger-500/20', className)} {...props}>
            {placeholder && <option value="" disabled>{placeholder}</option>}
            {options.map((opt) => <option key={opt.value} value={opt.value} disabled={opt.disabled}>{opt.label}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        {error && <p className="text-xs text-danger-600 mt-0.5">{error}</p>}
        {helper && !error && <p className="text-xs text-gray-500">{helper}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';