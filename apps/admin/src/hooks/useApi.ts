// app/admin/src/hooks/useApi.ts
import { useCallback, useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export function useApi() {
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);

  const headers = useCallback(() => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }), [token]);

  const request = useCallback(async (endpoint: string, init?: RequestInit) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...init,
      headers: {
        ...headers(),
        ...init?.headers,
      },
    });

    if (response.status === 401) {
      logout();
    }

    return response;
  }, [headers, logout]);

  const get = useCallback(async (endpoint: string) => {
    return request(endpoint);
  }, [request]);

  const post = useCallback(async (endpoint: string, body: any) => {
    return request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }, [request]);

  const patch = useCallback(async (endpoint: string, body: any) => {
    return request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }, [request]);

  const del = useCallback(async (endpoint: string) => {
    return request(endpoint, { method: 'DELETE' });
  }, [request]);

  return useMemo(() => ({ get, post, patch, del }), [del, get, patch, post]);
}
