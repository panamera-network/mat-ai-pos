// stores/staffCache.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StaffCache {
  staffList: any[];
  timecards: any[];
  payrolls: any[];
  timestamp: number;
  setData: (staffList: any[], timecards: any[], payrolls: any[]) => void;
  getData: () => { staffList: any[]; timecards: any[]; payrolls: any[] } | null;
  isExpired: () => boolean;
}

const EXPIRY_MS = 30 * 60 * 1000;

export const useStaffCache = create<StaffCache>()(
  persist(
    (set, get) => ({
      staffList: [],
      timecards: [],
      payrolls: [],
      timestamp: 0,
      setData: (staffList, timecards, payrolls) => set({ staffList, timecards, payrolls, timestamp: Date.now() }),
      getData: () => {
        const { staffList, timecards, payrolls, timestamp } = get();
        if (Date.now() - timestamp > EXPIRY_MS) return null;
        return { staffList, timecards, payrolls };
      },
      isExpired: () => {
        const { timestamp } = get();
        return Date.now() - timestamp > EXPIRY_MS;
      },
    }),
    { name: 'mat-admin-staff-cache' }
  )
);