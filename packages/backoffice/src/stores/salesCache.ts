import { create } from 'zustand';
import { DEFAULT_CACHE_TTL } from '../constants';

interface SalesSummary {
  total: number;
  count: number;
  avg: number;
}

interface SalesCacheState {
  orders: any[];
  summary: SalesSummary;
  period: string;
  timestamp: number;
  setData: (orders: any[], summary: SalesSummary, period: string) => void;
  getData: () => { orders: any[]; summary: SalesSummary; period: string } | null;
  isExpired: () => boolean;
  clear: () => void;
}

export const useSalesCache = create<SalesCacheState>((set, get) => ({
  orders: [],
  summary: { total: 0, count: 0, avg: 0 },
  period: '',
  timestamp: 0,

  setData: (orders, summary, period) =>
    set({ orders, summary, period, timestamp: Date.now() }),

  getData: () => {
    const { orders, summary, period, timestamp } = get();
    if (Date.now() - timestamp > DEFAULT_CACHE_TTL) return null;
    return { orders, summary, period };
  },

  isExpired: () => {
    const { timestamp } = get();
    return Date.now() - timestamp > DEFAULT_CACHE_TTL;
  },

  clear: () => set({ orders: [], summary: { total: 0, count: 0, avg: 0 }, period: '', timestamp: 0 }),
}));