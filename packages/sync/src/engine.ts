// packages/sync/src/engine.ts
// ============================================================
// Core sync engine — transport-agnostic
// Handles push/pull, conflict resolution, retry logic
// ============================================================

import type {
  SyncResult,
  ServerChange,
  SyncEngineOptions,
  SyncState,
  QueuedOperation,
} from './types';
import { syncQueue } from './queue';
import { LastWriteWinsResolver } from './resolver';
import { db, getTable } from '@mat-ai/db';
import { nowISO, backoffDelay } from './utils';

export class SyncEngine {
  private isSyncing = false;
  private options: SyncEngineOptions;
  private resolver: LastWriteWinsResolver;
  private abortController: AbortController | null = null;

  constructor(options: SyncEngineOptions) {
    this.options = options;
    this.resolver = new LastWriteWinsResolver({
      preferServerOnTie: true,
      serverWinsFields: ['updatedAt', 'syncedAt'],
    });
  }

  // ============ MAIN SYNC ============
  async sync(): Promise<SyncResult> {
    if (this.isSyncing) {
      return {
        success: false,
        pushed: 0,
        pulled: 0,
        conflicts: 0,
        errors: ['Sync already in progress'],
        startedAt: nowISO(),
      };
    }

    // Check transport connection
    if (!this.options.transport.isConnected()) {
      return {
        success: false,
        pushed: 0,
        pulled: 0,
        conflicts: 0,
        errors: ['Transport not connected'],
        startedAt: nowISO(),
      };
    }

    this.isSyncing = true;
    this.abortController = new AbortController();
    const startedAt = nowISO();

    const result: SyncResult = {
      success: true,
      pushed: 0,
      pulled: 0,
      conflicts: 0,
      errors: [],
      startedAt,
    };

    try {
      this.emitStateChange({ isSyncing: true });

      // === STEP 1: PUSH local changes to server ===
      const pending = await syncQueue.getPending();
      if (pending.length > 0) {
        // Batch operations
        const batchSize = 50;
        for (let i = 0; i < pending.length; i += batchSize) {
          const batch = pending.slice(i, i + batchSize);
          
          // Mark as syncing
          for (const op of batch) {
            await syncQueue.markSyncing(op.id);
          }

          try {
            const serverChanges = await this.options.transport.push(batch);
            result.pushed += batch.length;

            // Mark synced
            const syncedIds = batch.map(op => op.id);
            await syncQueue.markAllSynced(syncedIds);

            // Handle conflicts from server response
            if (serverChanges.length > 0) {
              const conflicts = this.resolver.resolveBatch(batch, serverChanges);
              for (const [changeId, resolution] of conflicts) {
                if (resolution.winner === 'server') {
                  const change = serverChanges.find(c => c.id === changeId);
                  if (change) {
                    await this.applyServerChange(change);
                    result.conflicts++;
                  }
                }
              }
            }
          } catch (error) {
            // Mark batch as failed
            const errorMsg = error instanceof Error ? error.message : 'Push failed';
            await syncQueue.markAllFailed(
              batch.map(op => ({ id: op.id, error: errorMsg }))
            );
            result.errors.push(errorMsg);
          }
        }
      }

      // === STEP 2: PULL server changes ===
      const lastSync = await this.getLastSyncAt();
      const serverChanges = await this.options.transport.pull(lastSync);
      result.pulled = serverChanges.length;

      for (const change of serverChanges) {
        await this.applyServerChange(change);
      }

      // === STEP 3: RETRY FAILED (with backoff) ===
      const failed = await syncQueue.getFailed();
      const retryable = failed.filter(op => op.retryCount < 3);
      
      for (const op of retryable) {
        const delay = backoffDelay(op.retryCount, 1000, 30000);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        try {
          await syncQueue.markSyncing(op.id);
          const serverChanges = await this.options.transport.push([op]);
          await syncQueue.markSynced(op.id);
          result.pushed++;
          
          if (serverChanges.length > 0) {
            result.conflicts++;
            await this.applyServerChange(serverChanges[0]);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Retry failed';
          await syncQueue.markFailed(op.id, errorMsg);
          result.errors.push(errorMsg);
        }
      }

      // Update last sync timestamp
      if (result.errors.length === 0 || result.pushed > 0 || result.pulled > 0) {
        await this.setLastSyncAt(nowISO());
      }

      result.completedAt = nowISO();
      this.options.onSyncComplete?.(result);

    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown sync error');
      this.options.onError?.(error instanceof Error ? error : new Error('Unknown sync error'));
    } finally {
      this.isSyncing = false;
      this.abortController = null;
      this.emitStateChange({ isSyncing: false });
    }

    return result;
  }

  // ============ ABORT ============
  abort(): void {
    this.abortController?.abort();
  }

  // ============ APPLY SERVER CHANGE ============
  private async applyServerChange(change: ServerChange): Promise<void> {
    const tableName = change.entity as keyof typeof db;
    const table = getTable(change.entity);
    if (!table) return;

    switch (change.operation) {
      case 'CREATE':
      case 'UPDATE': {
        // Upsert: put will create or update
        const record = {
          ...change.payload,
          id: change.serverId, // Map server ID to local ID
          syncedAt: change.serverTimestamp,
        };
        await table.put(record);
        break;
      }
      
      case 'DELETE': {
        await table.delete(change.serverId);
        break;
      }
      
      default:
        console.warn(`[Sync] Unknown operation: ${change.operation}`);
    }
  }

  // ============ LAST SYNC TIMESTAMP ============
  private async getLastSyncAt(): Promise<string | null> {
    try {
      const settings = await db.settings.get(1);
      return settings?.lastSyncAt || null;
    } catch {
      return null;
    }
  }

  private async setLastSyncAt(timestamp: string): Promise<void> {
    try {
      await db.settings.update(1, { lastSyncAt: timestamp });
    } catch (error) {
      console.warn('[Sync] Failed to update lastSyncAt:', error);
    }
  }

  // ============ STATE MANAGEMENT ============
  private async emitStateChange(partial: Partial<SyncState>): Promise<void> {
    const stats = await syncQueue.getStats();
    const state: SyncState = {
      isOnline: this.options.transport.isConnected(),
      lastSyncAt: await this.getLastSyncAt(),
      isSyncing: partial.isSyncing ?? this.isSyncing,
      pendingCount: stats.pending,
      failedCount: stats.failed,
    };
    
    this.options.onStateChange?.(state);
  }

  // ============ UTILITY ============
  getIsSyncing(): boolean {
    return this.isSyncing;
  }
}