import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Order, DiningTable, MenuItem } from '@mat-ai/types';

interface POSState {
  currentOrder: Order | null;
  setCurrentOrder: (order: Order | null) => void;
  activeTables: DiningTable[];
  setActiveTables: (tables: DiningTable[]) => void;
  menuItems: MenuItem[];
  setMenuItems: (items: MenuItem[]) => void;
  notifications: { id: string; message: string; type: 'info' | 'success' | 'warning' | 'error'; }[];
  addNotification: (notification: Omit<POSState['notifications'][0], 'id'>) => void;
  removeNotification: (id: string) => void;
}

export const usePOSStore = create<POSState>()(
  persist(
    (set) => ({
      currentOrder: null,
      setCurrentOrder: (order) => set({ currentOrder: order }),
      activeTables: [],
      setActiveTables: (tables) => set({ activeTables: tables }),
      menuItems: [],
      setMenuItems: (items) => set({ menuItems: items }),
      notifications: [],
      addNotification: (notification) =>
        set((state) => ({
          notifications: [...state.notifications, { ...notification, id: crypto.randomUUID() }],
        })),
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
    }),
    {
      name: 'mat-ai-pos-storage',
      partialize: (_state) => ({}),
    }
  )
);