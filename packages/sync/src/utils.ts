// packages/sync/src/utils.ts
// ============================================================
// Utility functions for sync operations
// Checksum, hashing, timestamp helpers
// ============================================================

/**
 * Generate SHA-256 checksum for payload
 * Used to detect duplicate or unchanged operations
 */
export async function generateChecksum(payload: Record<string, unknown> | object): Promise<string> {
  const json = JSON.stringify(payload, Object.keys(payload as Record<string, unknown>).sort());
  const encoder = new TextEncoder();
  const data = encoder.encode(json);
  
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Fallback for environments without crypto.subtle
  return simpleHash(json);
}

/**
 * Simple hash fallback (FNV-1a inspired)
 */
function simpleHash(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Compare two timestamps for last-write-wins
 * Returns: 'local' | 'server' | 'equal'
 */
export function compareTimestamps(localTime: string, serverTime: string): 'local' | 'server' | 'equal' {
  const local = new Date(localTime).getTime();
  const server = new Date(serverTime).getTime();
  
  if (local > server) return 'local';
  if (server > local) return 'server';
  return 'equal';
}

/**
 * Generate ISO timestamp with millisecond precision
 */
export function nowISO(): string {
  return new Date().toISOString();
}

/**
 * Debounce function for sync triggers
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Exponential backoff delay calculator
 */
export function backoffDelay(attempt: number, baseDelay: number, maxDelay: number): number {
  const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  // Add jitter (±25%) to prevent thundering herd
  const jitter = delay * 0.25 * (Math.random() * 2 - 1);
  return Math.floor(delay + jitter);
}

/**
 * Deep clone for payload isolation
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Strip internal fields from payload before sending
 * (e.g., remove Dexie-specific or computed fields)
 */
export function sanitizePayload(payload: Record<string, unknown> | object): Record<string, unknown> | object {
  const { _id, _rev, _syncStatus, ...clean } = payload as Record<string, unknown>;
  return clean;
}