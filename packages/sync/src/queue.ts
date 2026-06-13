// packages/sync/src/queue.ts
// ============================================================
// Offline operation queue — Dexie-based
// Stores pending operations until sync is available
// ============================================================

import Dexie from 'dexie';
import type { QueuedOperation, SyncEntity } from './types';
import { generateChecksum, nowISO } from './utils';

export class SyncQueue extends Dexie {
  operations!: Dexie.Table<QueuedOperation, string>;

  constructor() {
    super('MATaiSyncQueue');
    
    this.version(1).stores({
      operations: 'id, entity, status, timestamp, [status+entity], serverId',
    });
  }

  // ============ ENQUEUE ============
  async enqueue(
    entity: SyncEntity,
    operation: QueuedOperation['operation'],
    payload: Record<string, unknown> | object,
    localId: string,
    serverId?: string
  ): Promise<string> {
    const checksum = await generateChecksum(payload);
    const id = crypto.randomUUID();
    
    const op: QueuedOperation = {
      id,
      entity,
      operation,
      payload,
      localId,
      serverId,
      timestamp: nowISO(),
      retryCount: 0,
      status: 'pending',
      checksum,
    };
    
    await this.operations.add(op);
    return id;
  }

  // ============ GET PENDING ============
  async getPending(): Promise<QueuedOperation[]> {
    return this.operations
      .where('status')
      .equals('pending')
      .sortBy('timestamp');
  }

  // ============ GET BY ENTITY ============
  async getPendingByEntity(entity: SyncEntity): Promise<QueuedOperation[]> {
    return this.operations
      .where({ status: 'pending', entity })
      .sortBy('timestamp');
  }

  // ============ GET FAILED ============
  async getFailed(): Promise<QueuedOperation[]> {
    return this.operations
      .where('status')
      .equals('failed')
      .toArray();
  }

  // ============ GET RETRYABLE ============
  async getRetryable(maxRetries: number): Promise<QueuedOperation[]> {
    return this.operations
      .where('status')
      .equals('failed')
      .filter(op => op.retryCount < maxRetries)
      .toArray();
  }

  // ============ STATUS UPDATES ============
  async markSyncing(id: string): Promise<void> {
    await this.operations.update(id, { status: 'syncing' });
  }

  async markSynced(id: string): Promise<void> {
    await this.operations.delete(id);
  }

  async markFailed(id: string, error: string): Promise<void> {
    const op = await this.operations.get(id);
    if (!op) return;
    
    await this.operations.update(id, {
      status: 'failed',
      retryCount: op.retryCount + 1,
      error,
    });
  }

  // ============ BULK OPERATIONS ============
  async markAllSynced(ids: string[]): Promise<void> {
    await this.operations.bulkDelete(ids);
  }

  async markAllFailed(operations: { id: string; error: string }[]): Promise<void> {
  // Fetch all ops first
  const ops = await this.operations.bulkGet(operations.map(o => o.id));
  
  await this.operations.bulkUpdate(
    operations.map(({ id, error }, idx) => ({
      key: id,
      changes: {
        status: 'failed',
        retryCount: (ops[idx]?.retryCount || 0) + 1,
        error,
      },
    }))
  );
}

  // ============ STATS ============
  async getStats(): Promise<{ pending: number; failed: number; syncing: number; total: number }> {
    const [pending, failed, syncing, total] = await Promise.all([
      this.operations.where('status').equals('pending').count(),
      this.operations.where('status').equals('failed').count(),
      this.operations.where('status').equals('syncing').count(),
      this.operations.count(),
    ]);
    
    return { pending, failed, syncing, total };
  }

  // ============ CLEANUP ============
  async clearOld(days: number): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    const old = await this.operations
      .where('timestamp')
      .below(cutoff.toISOString())
      .and(op => op.status === 'synced' || op.status === 'failed')
      .toArray();
    
    await this.operations.bulkDelete(old.map(op => op.id));
    return old.length;
  }

  // ============ DUPLICATE CHECK ============
  async hasDuplicate(entity: SyncEntity, localId: string, checksum: string): Promise<boolean> {
    const count = await this.operations
      .where({ entity, localId })
      .and(op => op.checksum === checksum && op.status !== 'synced')
      .count();
    
    return count > 0;
  }
}

// Singleton instance
export const syncQueue = new SyncQueue();