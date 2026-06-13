import React from 'react';
import { cn } from '../lib/utils';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string; alt?: string; name?: string; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'away' | 'busy';
}

export const Avatar: React.FC<AvatarProps> = ({ src, alt, name, size = 'md', status, className, ...props }) => {
  const sizes = { xs: 'w-6 h-6 text-2xs', sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-lg' };
  const statusColors = { online: 'bg-success-500', offline: 'bg-gray-400', away: 'bg-warning-500', busy: 'bg-danger-500' };
  const initials = name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || '?';

  return (
    <div className={cn('relative inline-flex', className)} {...props}>
      <div className={cn('rounded-full overflow-hidden bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center font-semibold text-primary-700 dark:text-primary-300', sizes[size])}>
        {src ? <img src={src} alt={alt || name} className="w-full h-full object-cover" /> : <span>{initials}</span>}
      </div>
      {status && <span className={cn('absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-900', statusColors[status])} />}
    </div>
  );
};