// packages/ws/src/client.ts
// MAT.ai POS WebSocket Client (for KDS, Admin, QR apps)

import {
  type WSMessage,
  type WSMessageType,
  type StationRegisterPayload,
  createStationRegister,
  createItemDone,
  createOrderDone,
  createPing,
} from './protocol';

export interface WSClientOptions {
  url: string;
  stationName: string;
  categories: string[];
  deviceType?: 'tablet' | 'ipad' | 'android' | 'desktop';
  onMessage?: (msg: WSMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnectInterval?: number;
  heartbeatInterval?: number;
}

export class MATaiWSClient {
  private ws: WebSocket | null = null;
  private options: WSClientOptions;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private isIntentionallyClosed = false;
  private messageHandlers: Map<WSMessageType, Set<(msg: WSMessage) => void>> = new Map();

  constructor(options: WSClientOptions) {
    this.options = {
      deviceType: 'tablet',
      reconnectInterval: 3000,
      heartbeatInterval: 15000,
      ...options,
    };
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.isIntentionallyClosed = false;

    try {
      this.ws = new WebSocket(this.options.url);

      this.ws.onopen = () => {
        console.log('[WS] Connected to', this.options.url);
        this.startHeartbeat();
        this.options.onConnect?.();

        // Register station
        const registerMsg = createStationRegister(
          this.options.stationName,
          this.options.categories,
          this.options.deviceType
        );
        this.send(registerMsg);
      };

      this.ws.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data);
          this.handleMessage(msg);
        } catch (err) {
          console.error('[WS] Failed to parse message:', err);
        }
      };

      this.ws.onclose = () => {
        console.log('[WS] Disconnected');
        this.stopHeartbeat();
        this.options.onDisconnect?.();
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('[WS] Error:', error);
        this.options.onError?.(error);
      };
    } catch (err) {
      console.error('[WS] Failed to connect:', err);
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    this.isIntentionallyClosed = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }

  send(msg: WSMessage): boolean {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.warn('[WS] Cannot send, not connected');
      return false;
    }
    this.ws.send(JSON.stringify(msg));
    return true;
  }

  itemDone(orderId: string, itemIndex: number): boolean {
    return this.send(createItemDone(orderId, itemIndex, this.options.stationName));
  }

  orderDone(orderId: string): boolean {
    return this.send(createOrderDone(orderId, this.options.stationName));
  }

  on(type: WSMessageType, handler: (msg: WSMessage) => void): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.messageHandlers.get(type)?.delete(handler);
    };
  }

  off(type: WSMessageType, handler: (msg: WSMessage) => void): void {
    this.messageHandlers.get(type)?.delete(handler);
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private handleMessage(msg: WSMessage): void {
    // Call global handler
    this.options.onMessage?.(msg);

    // Call type-specific handlers
    const handlers = this.messageHandlers.get(msg.type);
    handlers?.forEach((h) => h(msg));

    // Handle ping
    if (msg.type === 'PING') {
      this.send(createPing());
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.send(createPing());
      }
    }, this.options.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.isIntentionallyClosed) return;
    if (this.reconnectTimer) return;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      console.log('[WS] Reconnecting...');
      this.connect();
    }, this.options.reconnectInterval);
  }
}

// Hook factory for React
export function createWSClient(options: WSClientOptions): MATaiWSClient {
  return new MATaiWSClient(options);
}
