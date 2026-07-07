import { useCallback, useEffect, useState } from 'react';
import { flushPosSyncQueue, getPosSyncStats, type PosSyncStats } from '../lib/posSync';

const emptyStats: PosSyncStats = {
  pending: 0,
  failed: 0,
  syncing: 0,
  total: 0,
};

export function usePosSyncStatus(intervalMs = 5000) {
  const [stats, setStats] = useState<PosSyncStats>(emptyStats);
  const [isFlushing, setIsFlushing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setStats(await getPosSyncStats());
  }, []);

  const flush = useCallback(async () => {
    setIsFlushing(true);
    setLastError(null);
    try {
      const result = await flushPosSyncQueue();
      if (result.errors.length > 0) setLastError(result.errors[0]);
      await refresh();
      return result;
    } finally {
      setIsFlushing(false);
    }
  }, [refresh]);

  useEffect(() => {
    void refresh();
    const interval = setInterval(() => void refresh(), intervalMs);
    const handleOnline = () => void flush();
    window.addEventListener('online', handleOnline);
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
    };
  }, [flush, intervalMs, refresh]);

  return {
    stats,
    isFlushing,
    lastError,
    refresh,
    flush,
  };
}
