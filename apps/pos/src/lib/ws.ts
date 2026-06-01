// apps/pos/src/lib/ws.ts
import { MATaiWSClient, createWSClient } from '@mat-ai/ws';
import type { WSMessage, WSMessageType } from '@mat-ai/ws';
import type { POSOrder } from './types';   // ← dari local types.ts, bukan @mat-ai/types

let client: MATaiWSClient | null = null;

export const wsClient = {
  get connected() {
    return client?.isConnected() ?? false;
  },

  connect(): void {
    if (client?.isConnected()) return;

    const stations = JSON.parse(localStorage.getItem('mat-pos-stations') || '[]');
    const defaultKds = stations.find((s: any) => s.type === 'kds' && s.enabled);
    const wsUrl = defaultKds
      ? `ws://${defaultKds.ip}:${defaultKds.port}`
      : 'ws://localhost:8080';

    client = createWSClient({
      url: wsUrl,
      stationName: 'POS-1',
      categories: ['Pizza', 'Pasta', 'Nasi', 'Side Order', 'Beverages', 'Extras'],
      deviceType: 'desktop',
      onConnect: () => console.log('[POS] WS connected'),
      onDisconnect: () => console.log('[POS] WS disconnected'),
      onError: (err) => console.error('[POS] WS error:', err),
    });

    client.connect();
  },

  disconnect(): void {
    client?.disconnect();
  },

  send(msg: WSMessage): boolean {
    return client?.send(msg) ?? false;
  },

  on(type: WSMessageType, handler: (msg: WSMessage) => void): () => void {
    return client?.on(type, handler) ?? (() => {});
  },

  broadcastOrder(order: POSOrder, event: 'NEW_ORDER' | 'UPDATE_ORDER' = 'NEW_ORDER'): boolean {
    if (!client?.isConnected()) {
      console.warn(`[POS] WS offline — ${event} queued:`, order.id);
      return false;
    }

    return client.send({
      type:   event === 'NEW_ORDER' ? 'NEW_ORDER' : 'ORDER_UPDATED',
      payload: order,
      timestamp: new Date().toISOString(),
      stationName: 'POS-1',
    } as WSMessage);
  },
};