import { syncQueue, type QueuedOperation } from '@mat-ai/sync';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export interface PosSyncStats {
  pending: number;
  failed: number;
  syncing: number;
  total: number;
}

export interface PosSyncResult {
  pushed: number;
  failed: number;
  errors: string[];
}

function stripId(payload: Record<string, unknown> | object): Record<string, unknown> {
  const { id, ...rest } = payload as Record<string, unknown>;
  return rest;
}

async function fetchJson(path: string, init?: RequestInit) {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`${response.status} ${text || response.statusText}`);
  }

  return response.json().catch(() => null);
}

async function pushOperation(operation: QueuedOperation) {
  switch (operation.entity) {
    case 'orders':
      if (operation.operation !== 'UPDATE') throw new Error(`Unsupported orders operation ${operation.operation}`);
      return fetchJson(`/orders/${operation.localId}`, {
        method: 'PATCH',
        body: JSON.stringify(stripId(operation.payload)),
      });

    case 'receipts':
      if (operation.operation !== 'CREATE') throw new Error(`Unsupported receipts operation ${operation.operation}`);
      return fetchJson('/receipts', {
        method: 'POST',
        body: JSON.stringify(stripId(operation.payload)),
      });

    case 'diningTables':
      if (operation.operation !== 'UPDATE') throw new Error(`Unsupported diningTables operation ${operation.operation}`);
      return fetchJson(`/tables/${operation.localId}`, {
        method: 'PATCH',
        body: JSON.stringify(stripId(operation.payload)),
      });

    default:
      throw new Error(`No POS REST sync adapter for ${operation.entity}`);
  }
}

export async function getPosSyncStats(): Promise<PosSyncStats> {
  return syncQueue.getStats();
}

export async function hasPendingPosSync(): Promise<boolean> {
  const stats = await getPosSyncStats();
  return stats.pending + stats.failed + stats.syncing > 0;
}

export async function flushPosSyncQueue(): Promise<PosSyncResult> {
  const [pending, failed] = await Promise.all([
    syncQueue.getPending(),
    syncQueue.getFailed(),
  ]);
  const operations = [...pending, ...failed.filter((operation) => operation.retryCount < 5)];
  const result: PosSyncResult = { pushed: 0, failed: 0, errors: [] };

  for (const operation of operations) {
    try {
      await syncQueue.markSyncing(operation.id);
      await pushOperation(operation);
      await syncQueue.markSynced(operation.id);
      result.pushed += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync failed';
      await syncQueue.markFailed(operation.id, message);
      result.failed += 1;
      result.errors.push(`${operation.entity}:${operation.localId} ${message}`);
    }
  }

  return result;
}

export async function enqueueOrderPaidSync(orderId: string, payload: Record<string, unknown>) {
  return syncQueue.enqueue('orders', 'UPDATE', { id: orderId, ...payload }, orderId);
}

export async function enqueueTableStatusSync(tableId: string, status: string) {
  return syncQueue.enqueue('diningTables', 'UPDATE', { id: tableId, status }, tableId);
}

export async function enqueueReceiptSync(receipt: object & { id: string }) {
  return syncQueue.enqueue('receipts', 'CREATE', receipt, receipt.id);
}

export async function tryCreateReceiptOnline(receipt: object): Promise<boolean> {
  try {
    await fetchJson('/receipts', {
      method: 'POST',
      body: JSON.stringify(stripId(receipt)),
    });
    return true;
  } catch (error) {
    console.warn('[Sync] Receipt create queued:', error);
    return false;
  }
}
