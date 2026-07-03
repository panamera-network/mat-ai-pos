import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Staff } from '@mat-ai/types';

interface AuthState {
  staff: Staff | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (staff: Staff, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      staff: null,
      token: null,
      isAuthenticated: false,
      login: (staff, token) => set({ staff, token, isAuthenticated: true }),
      logout: () => set({ staff: null, token: null, isAuthenticated: false }),
    }),
    { name: 'mat-admin-auth' }
  )
);
