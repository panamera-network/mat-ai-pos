// packages/sync/src/index.ts
// ============================================================
// Main exports for @mat-ai/sync
// Transport-agnostic sync engine for POS & Admin
// QR Menu fallback support
// ============================================================

// Core types
export * from './types';

// Core engine & queue
export { SyncEngine } from './engine';
export { syncQueue, SyncQueue } from './queue';
export { LastWriteWinsResolver, conflictResolver } from './resolver';

// State management (Zustand)
export {
  useSyncStore,
  useSyncOnline,
  useSyncing,
  useLastSync,
  usePendingCount,
  useFailedCount,
} from './state';

// Transports
export { SocketIOTransport } from './transport/socket-io';
export { HttpTransport } from './transport/http';

// React hooks
export { useSync } from './hooks/useSync';

// Fallback (QR Menu offline — WhatsApp/Telegram/SMS)
export { sendFallback } from './fallback';
export type { FallbackResult } from './fallback';

// Utilities
export {
  generateChecksum,
  compareTimestamps,
  nowISO,
  debounce,
  backoffDelay,
  deepClone,
  sanitizePayload,
} from './utils';