import React, { useState } from 'react';
import { cn } from '../lib/utils';

export interface TooltipProps { content: React.ReactNode; children: React.ReactElement; position?: 'top' | 'bottom' | 'left' | 'right'; delay?: number; }

export const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top', delay = 200 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);
  const show = () => { const id = setTimeout(() => setIsVisible(true), delay); setTimeoutId(id); };
  const hide = () => { if (timeoutId) clearTimeout(timeoutId); setIsVisible(false); };
  const positions = { top: 'bottom-full left-1/2 -translate-x-1/2 mb-2', bottom: 'top-full left-1/2 -translate-x-1/2 mt-2', left: 'right-full top-1/2 -translate-y-1/2 mr-2', right: 'left-full top-1/2 -translate-y-1/2 ml-2' };
  const arrows = { top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-900', bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900', left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-900', right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-900' };

  return (
    <div className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      {children}
      {isVisible && (
        <div className={cn('absolute z-50 animate-fade-in', positions[position])}>
          <div className="px-3 py-1.5 bg-gray-900 dark:bg-gray-700 text-white text-xs font-medium rounded-lg whitespace-nowrap shadow-lg">{content}</div>
          <div className={cn('absolute w-2 h-2 border-4 border-transparent', arrows[position])} />
        </div>
      )}
    </div>
  );
};