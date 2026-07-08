// hooks/useApi.ts
import { useAuthStore } from '@mat-ai/backoffice';
import { useCallback, useMemo } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const useApi = () => {
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);

  const fetchWithAuth = useCallback(async (url: string, options?: RequestInit) => {
    const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options?.headers as Record<string, string> | undefined,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(fullUrl, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      logout();
    }

    return res;
  }, [logout, token]);

  // Helper methods for convenience
  const get = useCallback(async <T = any>(url: string) => {
    const res = await fetchWithAuth(url);
    const data = res.ok ? await res.json() : null;
    return { ok: res.ok, data: data as T, status: res.status };
  }, [fetchWithAuth]);

  const post = useCallback(async <T = any>(url: string, body?: any) => {
    const res = await fetchWithAuth(url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = res.ok ? await res.json() : null;
    return { ok: res.ok, data: data as T, status: res.status };
  }, [fetchWithAuth]);

  const patch = useCallback(async <T = any>(url: string, body?: any) => {
    const res = await fetchWithAuth(url, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = res.ok ? await res.json() : null;
    return { ok: res.ok, data: data as T, status: res.status };
  }, [fetchWithAuth]);

  const del = useCallback(async <T = any>(url: string) => {
    const res = await fetchWithAuth(url, { method: 'DELETE' });
    const data = res.ok ? await res.json() : null;
    return { ok: res.ok, data: data as T, status: res.status };
  }, [fetchWithAuth]);

  return useMemo(() => ({ fetchWithAuth, get, post, patch, del }), 
    [fetchWithAuth, get, post, patch, del]);
};
