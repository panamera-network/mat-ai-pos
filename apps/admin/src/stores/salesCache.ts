// stores/salesCache.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SalesSummary {
  total: number;
  count: number;
  avg: number;
}

interface SalesCache {
  orders: any[];
  summary: SalesSummary;
  period: string;
  timestamp: number;
  setData: (orders: any[], summary: SalesSummary, period: string) => void;
  getData: () => { orders: any[]; summary: SalesSummary; period: string } | null;
  isExpired: () => boolean;
}

const EXPIRY_MS = 30 * 60 * 1000;

export const useSalesCache = create<SalesCache>()(
  persist(
    (set, get) => ({
      orders: [],
      summary: { total: 0, count: 0, avg: 0 },
      period: 'today',
      timestamp: 0,
      setData: (orders, summary, period) => set({ orders, summary, period, timestamp: Date.now() }),
      getData: () => {
        const { orders, summary, period, timestamp } = get();
        if (Date.now() - timestamp > EXPIRY_MS) return null;
        return { orders, summary, period };
      },
      isExpired: () => {
        const { timestamp } = get();
        return Date.now() - timestamp > EXPIRY_MS;
      },
    }),
    { name: 'mat-admin-sales-cache' }
  )
);