import { create } from 'zustand';
import { DEFAULT_CACHE_TTL } from '../constants';

interface StaffCacheState {
  staffList: any[];
  timecards: any[];
  payrolls: any[];
  timestamp: number;
  setData: (staffList: any[], timecards: any[], payrolls: any[]) => void;
  getData: () => { staffList: any[]; timecards: any[]; payrolls: any[] } | null;
  isExpired: () => boolean;
  clear: () => void;
}

export const useStaffCache = create<StaffCacheState>((set, get) => ({
  staffList: [],
  timecards: [],
  payrolls: [],
  timestamp: 0,

  setData: (staffList, timecards, payrolls) =>
    set({ staffList, timecards, payrolls, timestamp: Date.now() }),

  getData: () => {
    const { staffList, timecards, payrolls, timestamp } = get();
    if (Date.now() - timestamp > DEFAULT_CACHE_TTL) return null;
    return { staffList, timecards, payrolls };
  },

  isExpired: () => {
    const { timestamp } = get();
    return Date.now() - timestamp > DEFAULT_CACHE_TTL;
  },

  clear: () => set({ staffList: [], timecards: [], payrolls: [], timestamp: 0 }),
}));