// apps/kitchen/src/components/TimerBadge.tsx
import React from 'react';
import { Clock } from 'lucide-react';
import { getTimerState, formatElapsed, TIMER_COLORS } from '../utils/timer';

interface TimerBadgeProps {
  orderedAt: string;
}

export const TimerBadge: React.FC<TimerBadgeProps> = ({ orderedAt }) => {
  const timer = getTimerState(orderedAt);
  const colors = TIMER_COLORS[timer.color];

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
      <Clock className="w-3.5 h-3.5" />
      {formatElapsed(timer.minutes)}
    </div>
  );
};
