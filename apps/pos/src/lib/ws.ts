// apps/pos/src/lib/ws.ts
import { MATaiWSClient, createWSClient } from '@mat-ai/ws';
import type { WSMessage, WSMessageType } from '@mat-ai/ws';
import type { POSOrder } from './types';

let client: MATaiWSClient | null = null;

function getCategories(): string[] {
  try {
    const cats = JSON.parse(localStorage.getItem('mat-pos-categories') || '[]');
    return cats.map((c: any) => c.name).filter(Boolean);
  } catch {
    return ['Pizza', 'Pasta', 'Nasi', 'Side Order', 'Beverages', 'Extras'];
  }
}

function getWsUrl(): string {
  const stations = JSON.parse(localStorage.getItem('mat-pos-stations') || '[]');
  const defaultKds = stations.find((s: any) => s.type === 'kds' && s.enabled);
  return defaultKds
    ? `ws://${defaultKds.ip}:${defaultKds.port}`
    : 'ws://localhost:8080';
}

export const wsClient = {
  get connected() {
    return client?.isConnected() ?? false;
  },

  connect(): void {
    if (client?.isConnected()) return;

    client = createWSClient({
      url: getWsUrl(),
      stationName: 'POS-1',
      categories: getCategories(),
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
      type: event === 'NEW_ORDER' ? 'NEW_ORDER' : 'ORDER_UPDATED',
      payload: order,
      timestamp: new Date().toISOString(),
      stationName: 'POS-1',
    } as WSMessage);
  },
};
