// apps/pos/src/stores/posStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Staff, Order, DiningTable, MenuItem } from '@mat-ai/types';

interface POSState {
  // Auth
  currentStaff: Staff | null;
  isAuthenticated: boolean;
  login: (staff: Staff) => void;
  logout: () => void;

  // Current Order
  currentOrder: Order | null;
  setCurrentOrder: (order: Order | null) => void;

  // Active Tables
  activeTables: DiningTable[];
  setActiveTables: (tables: DiningTable[]) => void;

  // Menu
  menuItems: MenuItem[];
  setMenuItems: (items: MenuItem[]) => void;

  // Notifications
  notifications: {
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
  }[];
  addNotification: (
    notification: Omit<POSState['notifications'][0], 'id'>
  ) => void;
  removeNotification: (id: string) => void;
}

export const usePOSStore = create<POSState>()(
  persist(
    (set) => ({
      currentStaff: null,
      isAuthenticated: false,
      login: (staff) => set({ currentStaff: staff, isAuthenticated: true }),
      logout: () => set({ currentStaff: null, isAuthenticated: false }),

      currentOrder: null,
      setCurrentOrder: (order) => set({ currentOrder: order }),

      activeTables: [],
      setActiveTables: (tables) => set({ activeTables: tables }),

      menuItems: [],
      setMenuItems: (items) => set({ menuItems: items }),

      notifications: [],
      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            ...state.notifications,
            { ...notification, id: crypto.randomUUID() },
          ],
        })),
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
    }),
    {
      name: 'mat-ai-pos-storage',
      partialize: (state) => ({
        currentStaff: state.currentStaff,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
