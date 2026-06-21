// hooks/useApi.ts
import { useAuthStore } from '@mat-ai/backoffice';

export const useApi = () => {
  const token = useAuthStore((s) => s.token);
  
  const fetchWithAuth = async (url: string, options?: RequestInit) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options?.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  };
  
  return { fetchWithAuth };
};