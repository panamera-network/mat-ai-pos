// app/admin/src/hooks/useApi.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export function useApi() {
  const get = async (endpoint: string) => {
    return fetch(`${API_URL}${endpoint}`);
  };

  const post = async (endpoint: string, body: any) => {
    return fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };

  const patch = async (endpoint: string, body: any) => {
    return fetch(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };

  const del = async (endpoint: string) => {
    return fetch(`${API_URL}${endpoint}`, { method: 'DELETE' });
  };

  return { get, post, patch, del };
}