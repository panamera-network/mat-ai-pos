// packages/backoffice/src/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthStore } from '../types';
import type { Staff } from '@mat-ai/types';
import { API_BASE_URL } from '../constants';

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      staff: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (pinOrEmail: string, password?: string) => {
        const body = password 
          ? { email: pinOrEmail, password }   // Back Office
          : { pin: pinOrEmail };;

        try {
          const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            set({
              isLoading: false,
              error: err.message || 'Invalid PIN',
              isAuthenticated: false,
            });
            return false;
          }

          const { staff, token } = await res.json() as { staff: Staff; token: string };

          set({
            staff,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return true;
        } catch (err) {
          set({
            isLoading: false,
            error: 'Network error. Please try again.',
            isAuthenticated: false,
          });
          return false;
        }
      },

      logout: () => {
        set({
          staff: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      clearError: () => set({ error: null }),

      checkAuth: () => {
        const { token, staff } = get();
        return !!token && !!staff;
      },
    }),
    {
      name: 'mat-ai-auth',
      partialize: (state) => ({
        staff: state.staff,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);