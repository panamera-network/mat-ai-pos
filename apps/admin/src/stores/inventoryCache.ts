// stores/inventoryCache.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface InventoryCache {
  inventory: any[];
  stockLogs: any[];
  timestamp: number;
  setData: (inventory: any[], stockLogs: any[]) => void;
  getData: () => { inventory: any[]; stockLogs: any[] } | null;
  isExpired: () => boolean;
}

const EXPIRY_MS = 30 * 60 * 1000;

export const useInventoryCache = create<InventoryCache>()(
  persist(
    (set, get) => ({
      inventory: [],
      stockLogs: [],
      timestamp: 0,
      setData: (inventory, stockLogs) => set({ inventory, stockLogs, timestamp: Date.now() }),
      getData: () => {
        const { inventory, stockLogs, timestamp } = get();
        if (Date.now() - timestamp > EXPIRY_MS) return null;
        return { inventory, stockLogs };
      },
      isExpired: () => {
        const { timestamp } = get();
        return Date.now() - timestamp > EXPIRY_MS;
      },
    }),
    { name: 'mat-admin-inventory-cache' }
  )
);