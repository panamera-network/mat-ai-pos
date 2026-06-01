// apps/kitchen/src/hooks/useTimer.ts
import { useEffect } from 'react';
import { useKitchenStore } from '../stores/kitchenStore';

export function useTimer(intervalMs = 30000) {
  const updateTimers = useKitchenStore((state) => state.updateTimers);

  useEffect(() => {
    // Update immediately
    updateTimers();

    // Then every interval
    const timer = setInterval(() => {
      updateTimers();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [updateTimers, intervalMs]);
}
