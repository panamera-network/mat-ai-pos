// apps/kitchen/src/utils/timer.ts
import type { TimerColor, TimerState } from '../types/kitchen';

export function getTimerState(orderedAt: string): TimerState {
  const ordered = new Date(orderedAt).getTime();
  const now = Date.now();
  const diffMs = now - ordered;
  const minutes = Math.floor(diffMs / 60000);

  let color: TimerColor;
  if (minutes < 15) {
    color = 'green';
  } else if (minutes < 25) {
    color = 'yellow';
  } else {
    color = 'red';
  }

  return { minutes, color };
}

export function formatElapsed(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

export const TIMER_COLORS: Record<TimerColor, { bg: string; text: string; border: string }> = {
  green: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
  yellow: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
  red: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
};
