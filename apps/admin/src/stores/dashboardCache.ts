// stores/dashboardCache.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DashboardStats {
  todaySales: number;
  activeStaff: number;
  lowStock: number;
  pendingLeave: number;
  todayOrders: number;
}

interface DashboardCache {
  stats: DashboardStats;
  timestamp: number;
  setStats: (stats: DashboardStats) => void;
  getStats: () => DashboardStats | null;
  isExpired: () => boolean;
}

const EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

export const useDashboardCache = create<DashboardCache>()(
  persist(
    (set, get) => ({
      stats: {
        todaySales: 0,
        activeStaff: 0,
        lowStock: 0,
        pendingLeave: 0,
        todayOrders: 0,
      },
      timestamp: 0,
      setStats: (stats) => set({ stats, timestamp: Date.now() }),
      getStats: () => {
        const { stats, timestamp } = get();
        if (Date.now() - timestamp > EXPIRY_MS) return null;
        return stats;
      },
      isExpired: () => {
        const { timestamp } = get();
        return Date.now() - timestamp > EXPIRY_MS;
      },
    }),
    { name: 'mat-admin-dashboard-cache' }
  )
);