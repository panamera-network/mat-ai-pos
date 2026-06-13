// apps/pos/src/lib/ws.ts
import { MATaiWSServer } from '@mat-ai/ws';
import type { WSServerOptions } from '@mat-ai/ws';
import type { Order, KitchenStatus, ItemStatus } from '@mat-ai/types';

let server: MATaiWSServer | null = null;

function getWsPort(): number {
  const settings = JSON.parse(localStorage.getItem('mat-pos-settings') || '{}');
  return settings.wsPort || 3001;
  
}

function itemStatusToKitchenStatus(status: ItemStatus): KitchenStatus {
  switch (status) {
    case 'PENDING': return 'pending';
    case 'PREPARING': return 'preparing';
    case 'READY': return 'done';
    case 'SERVED': return 'done';
    default: return 'pending';
  }
}

export const wsServer = {
  get isRunning() {
    return !!server;
  },

  start(): void {
    if (server) return;

    const options: WSServerOptions = {
      port: getWsPort(),
      onStationConnect: (station) => {
        console.log('[POS-WS] KDS connected:', station.name, station.id);
      },
      onStationDisconnect: (stationId) => {
        console.log('[POS-WS] KDS disconnected:', stationId);
      },
      onItemDone: (payload) => {
        console.log('[POS-WS] Item done:', payload.orderId, payload.itemIndex);
        // TODO: update order item status in Dexie
      },
      onItemUndone: (payload) => {
        console.log('[POS-WS] Item undone:', payload.orderId, payload.itemIndex);
        // TODO: update order item status in Dexie
      },
      onOrderDone: (payload) => {
        console.log('[POS-WS] Order done:', payload.orderId);
        // TODO: mark order complete in Dexie
      },
    };

    server = new MATaiWSServer(options);
    server.start();
    console.log('[POS-WS] Server started on port', getWsPort());
  },

  stop(): void {
    server?.stop();
    server = null;
    console.log('[POS-WS] Server stopped');
  },

  broadcastOrder(order: Order): void {
    if (!server) {
      console.warn('[POS-WS] Server not running — order not broadcasted');
      return;
    }
    server.broadcastOrderCreated(order);
    console.log('[POS-WS] Broadcasted order:', order.orderNumber);
  },

  broadcastOrderUpdate(orderId: string, itemStatus: ItemStatus): void {
  if (!server) return;
  const kitchenStatus = itemStatusToKitchenStatus(itemStatus);
  server.broadcastOrderUpdated(orderId, kitchenStatus, kitchenStatus);
  }
};