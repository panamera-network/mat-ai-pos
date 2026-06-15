import { useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { API_BASE_URL } from '../constants';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
}

export function useApi() {
  const token = useAuthStore((s) => s.token);

  const request = useCallback(
    async <T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<{ ok: boolean; data?: T; status: number; error?: string }> => {
      const url = `${API_BASE_URL}${endpoint}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      try {
        const res = await fetch(url, {
          method: options.method || 'GET',
          headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => 'Unknown error');
          return { ok: false, status: res.status, error: errText };
        }

        const contentType = res.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const data = await res.json() as T;
          return { ok: true, data, status: res.status };
        }

        return { ok: true, status: res.status };
      } catch (err) {
        return { ok: false, status: 0, error: 'Network error' };
      }
    },
    [token]
  );

  const get = useCallback(
    <T = unknown>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
    [request]
  );

  const post = useCallback(
    <T = unknown>(endpoint: string, body: Record<string, unknown>) =>
      request<T>(endpoint, { method: 'POST', body }),
    [request]
  );

  const patch = useCallback(
    <T = unknown>(endpoint: string, body: Record<string, unknown>) =>
      request<T>(endpoint, { method: 'PATCH', body }),
    [request]
  );

  const del = useCallback(
    <T = unknown>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
    [request]
  );

  return { get, post, patch, del, request };
}