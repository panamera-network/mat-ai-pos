import { useState, useEffect, useCallback } from 'react';
import { Promotion } from '@mat-ai/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const OUTLET_ID = import.meta.env.VITE_OUTLET_ID || 'default-outlet';

export function usePromotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActive = useCallback(async (customerType: string = 'ALL') => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/promotions/active/${OUTLET_ID}?customerType=${customerType}`
      );
      if (!res.ok) throw new Error('Failed to fetch promotions');
      const data = await res.json();
      setPromotions(data);
      return data;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActive();
  }, [fetchActive]);

  return { promotions, loading, error, refetch: fetchActive };
}
