import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Staff } from '@mat-ai/types';

interface AuthState {
  staff: Staff | null;
  isAuthenticated: boolean;
  login: (staff: Staff) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      staff: null,
      isAuthenticated: false,
      login: (staff) => set({ staff, isAuthenticated: true }),
      logout: () => set({ staff: null, isAuthenticated: false }),
    }),
    { name: 'mat-admin-auth' }
  )
);