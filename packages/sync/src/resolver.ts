// packages/sync/src/resolver.ts
// ============================================================
// Conflict resolution — Last-Write-Wins (LWW)
// Timestamp-based resolution with optional merge
// ============================================================

import type { QueuedOperation, ServerChange, ConflictResolution } from './types';
import { compareTimestamps } from './utils';

export interface ResolverOptions {
  /** Prefer server on equal timestamps (default: true) */
  preferServerOnTie?: boolean;
  /** Fields to always prefer server value */
  serverWinsFields?: string[];
  /** Fields to always prefer local value */
  localWinsFields?: string[];
}

export class LastWriteWinsResolver {
  private options: ResolverOptions;

  constructor(options: ResolverOptions = {}) {
    this.options = {
      preferServerOnTie: true,
      serverWinsFields: [],
      localWinsFields: [],
      ...options,
    };
  }

  /**
   * Resolve conflict between local operation and server change
   */
  resolve(local: QueuedOperation, server: ServerChange): ConflictResolution {
    const comparison = compareTimestamps(local.timestamp, server.serverTimestamp);
    
    // Equal timestamps — apply tiebreaker
    if (comparison === 'equal') {
      return this.options.preferServerOnTie
        ? { winner: 'server' }
        : { winner: 'local' };
    }
    
    // Different timestamps — LWW
    if (comparison === 'local') {
      return { winner: 'local' };
    }
    
    return { winner: 'server' };
  }

  /**
   * Merge payloads with field-level rules
   * Returns merged payload if merge is possible, null if full replacement needed
   */
  merge(
    localPayload: Record<string, unknown>,
    serverPayload: Record<string, unknown>
  ): Record<string, unknown> | null {
    const merged: Record<string, unknown> = {};
    const allKeys = new Set([...Object.keys(localPayload), ...Object.keys(serverPayload)]);
    
    for (const key of allKeys) {
      // Field-level rules
      if (this.options.serverWinsFields?.includes(key)) {
        merged[key] = serverPayload[key];
        continue;
      }
      
      if (this.options.localWinsFields?.includes(key)) {
        merged[key] = localPayload[key];
        continue;
      }
      
      // Default: prefer server (safer for multi-device)
      merged[key] = serverPayload[key] !== undefined ? serverPayload[key] : localPayload[key];
    }
    
    return merged;
  }

  /**
   * Batch resolve multiple conflicts
   */
  resolveBatch(
    localOps: QueuedOperation[],
    serverChanges: ServerChange[]
  ): Map<string, ConflictResolution> {
    const results = new Map<string, ConflictResolution>();
    
    for (const serverChange of serverChanges) {
      const localOp = localOps.find(
        op => op.entity === serverChange.entity && op.serverId === serverChange.serverId
      );
      
      if (localOp) {
        results.set(serverChange.id, this.resolve(localOp, serverChange));
      } else {
        // No local conflict — server wins by default
        results.set(serverChange.id, { winner: 'server' });
      }
    }
    
    return results;
  }
}

// Default resolver instance
export const conflictResolver = new LastWriteWinsResolver({
  preferServerOnTie: true,
  serverWinsFields: ['updatedAt', 'syncedAt'],
});