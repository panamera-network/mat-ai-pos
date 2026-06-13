import React from 'react';
import { cn } from '../lib/utils';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode; title: string; description?: string;
  action?: { label: string; onClick: () => void; };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action, className, ...props }) => (
  <div className={cn('flex flex-col items-center justify-center text-center py-12 px-4', className)} {...props}>
    <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
      {icon || <Inbox className="w-8 h-8 text-gray-400" />}
    </div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
    {description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm">{description}</p>}
    {action && <button onClick={action.onClick} className="mt-4 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors">{action.label}</button>}
  </div>
);