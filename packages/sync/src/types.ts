// packages/sync/src/types.ts
// ============================================================
// Sync-specific types — shared across all apps
// Transport-agnostic (works with Socket.IO, HTTP, or WS)
// ============================================================

import type { BaseEntity } from '@mat-ai/types';

// ============ OPERATION TYPES ============
export type SyncOperation = 'CREATE' | 'UPDATE' | 'DELETE';

// Entity types that can be synced
// Must match Dexie table names in @mat-ai/db
export type SyncEntity =
  | 'staff'
  | 'timecards'
  | 'categories'
  | 'menuItems'
  | 'diningTables'
  | 'reservations'
  | 'stations'
  | 'orders'
  | 'receipts'
  | 'inventoryLogs'
  | 'lowStockAlerts'
  | 'settings'
  | 'qrOrders'
  | 'refundRequests'
  | 'voidRecords'
  | 'leaves'
  | 'advances'
  | 'payrolls'
  | 'inventoryItems'
  | 'stockLogs';

// ============ QUEUED OPERATION ============
export interface QueuedOperation {
  id: string; // UUID v4
  entity: SyncEntity;
  operation: SyncOperation;
  payload: Record<string, unknown> | object; // JSON-serializable data
  localId: string; // Dexie primary key
  serverId?: string; // PostgreSQL ID (null for CREATE before sync)
  timestamp: string; // ISO 8601 — for conflict resolution (last-write-wins)
  retryCount: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  error?: string;
  checksum: string; // SHA-256 hash of payload for change detection
}

export interface ConflictResolution {
  winner: 'local' | 'server'; merged?: 
  Record<string, unknown> 
}

// ============ SERVER CHANGE ============
export interface ServerChange {
  id: string; // Server operation ID
  entity: SyncEntity;
  operation: SyncOperation;
  payload: Record<string, unknown>;
  serverTimestamp: string; // ISO 8601
  serverId: string; // PostgreSQL record ID
  deviceId?: string; // Source device (for multi-POS)
}

// ============ SYNC STATE ============
export interface SyncState {
  isOnline: boolean;
  lastSyncAt: string | null;
  isSyncing: boolean;
  pendingCount: number;
  failedCount: number;
}

// ============ SYNC RESULT ============
export interface SyncResult {
  success: boolean;
  pushed: number; // Operations sent to server
  pulled: number; // Operations received from server
  conflicts: number; // Conflicts resolved
  errors: string[];
  startedAt: string;
  completedAt?: string;
}

// ============ SYNC CONFIG ============
export interface SyncConfig {
  deviceId: string; // Unique POS/device identifier
  posId: string;
  authToken: string;
  serverUrl: string;
  autoSync: boolean;
  syncInterval: number; // seconds
  maxRetries: number;
  retryDelay: number; // ms
  batchSize: number; // operations per push
}

// ============ TRANSPORT INTERFACE ============
export interface SyncTransport {
  connect(): void;
  disconnect(): void;
  isConnected(): boolean;
  push(operations: QueuedOperation[]): Promise<ServerChange[]>;
  pull(lastSyncAt: string | null): Promise<ServerChange[]>;
  onServerPush(callback: (changes: ServerChange[]) => void): void;
  onConnect(callback: () => void): void;
  onDisconnect(callback: () => void): void;
}

// ============ SYNC ENGINE OPTIONS ============
export interface SyncEngineOptions {
  transport: SyncTransport;
  onStateChange?: (state: SyncState) => void;
  onError?: (error: Error) => void;
  onSyncComplete?: (result: SyncResult) => void;
}