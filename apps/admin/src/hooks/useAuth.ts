import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useApi } from './useApi';

export function useAuth() {
  const { staff, isAuthenticated, login, logout } = useAuthStore();
  const { post } = useApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loginWithPin = async (pin: string) => {
  setLoading(true);
  setError('');
  try {
    const res = await post('/auth/login', { pin });
    if (res.ok) {
      const data = await res.json();
      login(data.staff);
      setLoading(false);
      return true;
    }
    const err = await res.text();
    setError(err || 'Invalid PIN');
    setLoading(false);
    return false;
  } catch (err) {
    setError('No connection');
    setLoading(false);
    return false;
  }
};

  return { staff, isAuthenticated, loginWithPin, logout, loading, error };
}