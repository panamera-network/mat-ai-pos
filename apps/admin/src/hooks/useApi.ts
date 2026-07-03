// app/admin/src/hooks/useApi.ts
import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export function useApi() {
  const token = useAuthStore((state) => state.token);

  const headers = () => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });

  const get = async (endpoint: string) => {
    return fetch(`${API_URL}${endpoint}`, { headers: headers() });
  };

  const post = async (endpoint: string, body: any) => {
    return fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    });
  };

  const patch = async (endpoint: string, body: any) => {
    return fetch(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify(body),
    });
  };

  const del = async (endpoint: string) => {
    return fetch(`${API_URL}${endpoint}`, { method: 'DELETE', headers: headers() });
  };

  return { get, post, patch, del };
}
