// packages/sync/src/transport/socket-io.ts
// ============================================================
// Socket.IO transport — for POS & Admin apps
// Real-time bidirectional sync with NestJS backend
// ============================================================

import { io, Socket } from 'socket.io-client';
import type { SyncTransport, QueuedOperation, ServerChange, SyncConfig } from '../types';

export interface SocketIOTransportOptions {
  serverUrl: string;
  authToken: string;
  posId: string;
  deviceId: string;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

export class SocketIOTransport implements SyncTransport {
  private socket: Socket | null = null;
  private options: SocketIOTransportOptions;
  private serverPushCallbacks: ((changes: ServerChange[]) => void)[] = [];
  private connectCallbacks: (() => void)[] = [];
  private disconnectCallbacks: (() => void)[] = [];
  private reconnectAttempts = 0;

  constructor(options: SocketIOTransportOptions) {
    this.options = {
      reconnectDelay: 5000,
      maxReconnectAttempts: 10,
      ...options,
    };
  }

  // ============ CONNECTION ============
  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(this.options.serverUrl, {
      auth: {
        token: this.options.authToken,
        posId: this.options.posId,
        deviceId: this.options.deviceId,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: this.options.reconnectDelay,
      reconnectionAttempts: this.options.maxReconnectAttempts,
    });

    this.socket.on('connect', () => {
      console.log('[SocketIO] Connected');
      this.reconnectAttempts = 0;
      this.connectCallbacks.forEach(cb => cb());
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[SocketIO] Disconnected:', reason);
      this.disconnectCallbacks.forEach(cb => cb());
    });

    this.socket.on('connect_error', (error) => {
      console.error('[SocketIO] Connection error:', error.message);
      this.reconnectAttempts++;
    });

    // Server-initiated push (real-time updates from other devices)
    this.socket.on('server:push', (changes: ServerChange[]) => {
      console.log('[SocketIO] Received server push:', changes.length, 'changes');
      this.serverPushCallbacks.forEach(cb => cb(changes));
    });

    // Server broadcast (e.g., new order from QR menu)
    this.socket.on('server:broadcast', (change: ServerChange) => {
      console.log('[SocketIO] Received broadcast:', change.entity, change.operation);
      this.serverPushCallbacks.forEach(cb => cb([change]));
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // ============ PUSH (Client → Server) ============
  async push(operations: QueuedOperation[]): Promise<ServerChange[]> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('client:push', operations, (response: unknown) => {
        if (typeof response === 'object' && response !== null && 'error' in response) {
          reject(new Error((response as { error: string }).error));
        } else if (Array.isArray(response)) {
          resolve(response as ServerChange[]);
        } else {
          reject(new Error('Invalid server response'));
        }
      });

      // Timeout fallback
      setTimeout(() => reject(new Error('Push timeout')), 30000);
    });
  }

  // ============ PULL (Server → Client) ============
  async pull(lastSyncAt: string | null): Promise<ServerChange[]> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('client:pull', { lastSyncAt }, (response: unknown) => {
        if (typeof response === 'object' && response !== null && 'error' in response) {
          reject(new Error((response as { error: string }).error));
        } else if (Array.isArray(response)) {
          resolve(response as ServerChange[]);
        } else {
          reject(new Error('Invalid server response'));
        }
      });

      setTimeout(() => reject(new Error('Pull timeout')), 30000);
    });
  }

  // ============ EVENT HANDLERS ============
  onServerPush(callback: (changes: ServerChange[]) => void): void {
    this.serverPushCallbacks.push(callback);
  }

  onConnect(callback: () => void): void {
    this.connectCallbacks.push(callback);
  }

  onDisconnect(callback: () => void): void {
    this.disconnectCallbacks.push(callback);
  }

  // ============ UTILITY ============
  getSocket(): Socket | null {
    return this.socket;
  }

  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }
}