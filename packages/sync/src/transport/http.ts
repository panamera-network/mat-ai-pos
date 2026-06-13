// packages/sync/src/transport/http.ts
// ============================================================
// HTTP transport — for QR Menu or fallback
// REST API based, no persistent connection
// ============================================================

import type { SyncTransport, QueuedOperation, ServerChange } from '../types';

export interface HttpTransportOptions {
  baseUrl: string;
  authToken: string;
  posId: string;
  deviceId: string;
  timeout?: number;
}

export class HttpTransport implements SyncTransport {
  private options: HttpTransportOptions;
  private serverPushCallbacks: ((changes: ServerChange[]) => void)[] = [];
  private connectCallbacks: (() => void)[] = [];
  private disconnectCallbacks: (() => void)[] = [];
  private _isConnected = false;

  constructor(options: HttpTransportOptions) {
    this.options = {
      timeout: 30000,
      ...options,
    };
  }

  // ============ CONNECTION (no-op for HTTP) ============
  connect(): void {
    // HTTP is stateless — simulate connected
    this._isConnected = true;
    this.connectCallbacks.forEach(cb => cb());
  }

  disconnect(): void {
    this._isConnected = false;
    this.disconnectCallbacks.forEach(cb => cb());
  }

  isConnected(): boolean {
    // Check if we can reach server (lightweight ping)
    return this._isConnected;
  }

  // ============ PUSH ============
  async push(operations: QueuedOperation[]): Promise<ServerChange[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);

    try {
      const response = await fetch(`${this.options.baseUrl}/sync/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.options.authToken}`,
          'X-POS-ID': this.options.posId,
          'X-Device-ID': this.options.deviceId,
        },
        body: JSON.stringify({ operations }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Push failed' }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.changes as ServerChange[] || [];
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // ============ PULL ============
  async pull(lastSyncAt: string | null): Promise<ServerChange[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);

    try {
      const params = new URLSearchParams();
      if (lastSyncAt) params.append('lastSyncAt', lastSyncAt);
      params.append('posId', this.options.posId);
      params.append('deviceId', this.options.deviceId);

      const response = await fetch(`${this.options.baseUrl}/sync/pull?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.options.authToken}`,
          'X-POS-ID': this.options.posId,
          'X-Device-ID': this.options.deviceId,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Pull failed' }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.changes as ServerChange[] || [];
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // ============ EVENT HANDLERS (no-op for HTTP) ============
  onServerPush(callback: (changes: ServerChange[]) => void): void {
    this.serverPushCallbacks.push(callback);
  }

  onConnect(callback: () => void): void {
    this.connectCallbacks.push(callback);
  }

  onDisconnect(callback: () => void): void {
    this.disconnectCallbacks.push(callback);
  }

  // ============ HEALTH CHECK ============
  async ping(): Promise<boolean> {
    try {
      const response = await fetch(`${this.options.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.options.authToken}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}