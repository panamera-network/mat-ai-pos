// apps/qr-menu/src/hooks/useLandingPage.ts
import { useState, useEffect, useCallback } from 'react';
import { LandingPagePublicData } from '@mat-ai/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const OUTLET_ID = import.meta.env.VITE_OUTLET_ID || 'default-outlet';

export function useLandingPage() {
  const [data, setData] = useState<LandingPagePublicData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/landing-page/public?outletId=${OUTLET_ID}`);
      if (!res.ok) throw new Error('Failed to fetch landing page content');
      const result = await res.json();
      setData(result);
      return result;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}