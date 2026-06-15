import { create } from 'zustand';
import { DEFAULT_CACHE_TTL } from '../constants';

interface DashboardStats {
  todaySales: number;
  activeStaff: number;
  lowStock: number;
  pendingLeave: number;
  todayOrders: number;
}

interface DashboardCacheState {
  stats: DashboardStats | null;
  timestamp: number;
  setStats: (stats: DashboardStats) => void;
  getStats: () => DashboardStats | null;
  isExpired: () => boolean;
  clear: () => void;
}

export const useDashboardCache = create<DashboardCacheState>((set, get) => ({
  stats: null,
  timestamp: 0,

  setStats: (stats) => set({ stats, timestamp: Date.now() }),

  getStats: () => {
    const { stats, timestamp } = get();
    if (!stats) return null;
    if (Date.now() - timestamp > DEFAULT_CACHE_TTL) return null;
    return stats;
  },

  isExpired: () => {
    const { timestamp } = get();
    return Date.now() - timestamp > DEFAULT_CACHE_TTL;
  },

  clear: () => set({ stats: null, timestamp: 0 }),
}));