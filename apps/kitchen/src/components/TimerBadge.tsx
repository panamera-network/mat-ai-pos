// apps/kitchen/src/components/TimerBadge.tsx
import React from 'react';
import { Badge } from '@mat-ai/ui';
import { Clock } from 'lucide-react';
import { getTimerState, formatElapsed } from '../utils/timer';

interface TimerBadgeProps {
  orderedAt: string;
}

export const TimerBadge: React.FC<TimerBadgeProps> = ({ orderedAt }) => {
  const timer = getTimerState(orderedAt);

  const variant = timer.color === 'green' ? 'success' : timer.color === 'yellow' ? 'warning' : 'danger';

  return (
    <Badge variant={variant} size="sm" dot>
      <Clock className="w-3 h-3 mr-1" />
      {formatElapsed(timer.minutes)}
    </Badge>
  );
};