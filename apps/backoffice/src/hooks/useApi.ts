// hooks/useApi.ts
import { useAuthStore } from '@mat-ai/backoffice';
import { useMemo } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const useApi = () => {
  const token = useAuthStore((s) => s.token);

  const fetchWithAuth = async (url: string, options?: RequestInit) => {
    const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
    return fetch(fullUrl, {
      ...options,
      headers: {
        ...options?.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  };

  // Helper methods for convenience
  const get = async <T = any>(url: string) => {
    const res = await fetchWithAuth(url);
    const data = res.ok ? await res.json() : null;
    return { ok: res.ok, data: data as T, status: res.status };
  };

  const post = async <T = any>(url: string, body?: any) => {
    const res = await fetchWithAuth(url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = res.ok ? await res.json() : null;
    return { ok: res.ok, data: data as T, status: res.status };
  };

  const patch = async <T = any>(url: string, body?: any) => {
    const res = await fetchWithAuth(url, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = res.ok ? await res.json() : null;
    return { ok: res.ok, data: data as T, status: res.status };
  };

  const del = async <T = any>(url: string) => {
    const res = await fetchWithAuth(url, { method: 'DELETE' });
    const data = res.ok ? await res.json() : null;
    return { ok: res.ok, data: data as T, status: res.status };
  };

  return useMemo(() => ({ fetchWithAuth, get, post, patch, del }), 
    [fetchWithAuth, get, post, patch, del]);
};