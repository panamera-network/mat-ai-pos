// packages/sync/src/state.ts
// ============================================================
// Zustand store for sync state management
// Used in POS and Admin apps
// ============================================================

import { create } from 'zustand';
import type { SyncState, SyncResult } from './types';

interface SyncStore extends SyncState {
  // Actions
  setOnline: (online: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setLastSync: (timestamp: string | null) => void;
  setPendingCount: (count: number) => void;
  setFailedCount: (count: number) => void;
  recordSync: (result: SyncResult) => void;
  reset: () => void;
}

const initialState: SyncState = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  lastSyncAt: null,
  isSyncing: false,
  pendingCount: 0,
  failedCount: 0,
};

export const useSyncStore = create<SyncStore>((set) => ({
  ...initialState,

  setOnline: (online) => set({ isOnline: online }),

  setSyncing: (syncing) => set({ isSyncing: syncing }),

  setLastSync: (timestamp) => set({ lastSyncAt: timestamp }),

  setPendingCount: (count) => set({ pendingCount: count }),

  setFailedCount: (count) => set({ failedCount: count }),

  recordSync: (result) =>
    set((state) => ({
      lastSyncAt: result.success ? new Date().toISOString() : state.lastSyncAt,
      pendingCount: Math.max(0, state.pendingCount - result.pushed),
      failedCount: result.success ? 0 : state.failedCount + result.errors.length,
    })),

  reset: () => set(initialState),
}));

// Selector hooks for performance
export const useSyncOnline = () => useSyncStore((state) => state.isOnline);
export const useSyncing = () => useSyncStore((state) => state.isSyncing);
export const useLastSync = () => useSyncStore((state) => state.lastSyncAt);
export const usePendingCount = () => useSyncStore((state) => state.pendingCount);
export const useFailedCount = () => useSyncStore((state) => state.failedCount);