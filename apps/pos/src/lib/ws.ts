import type { Order, KitchenStatus, ItemStatus } from '@mat-ai/types';

let running = false;

function getBridgeSettings(): { host: string; port: number } {
  try {
    const settings = JSON.parse(localStorage.getItem('mat-pos-settings') || '{}');
    return {
      host: settings.bridgeHost || settings.wsHost || 'localhost',
      port: Number(settings.bridgePort || settings.wsPort || 8080),
    };
  } catch {
    return { host: 'localhost', port: 8080 };
  }
}

async function postToBridge(path: string, payload: unknown): Promise<void> {
  const { host, port } = getBridgeSettings();
  const url = `http://${host}:${port}${path}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Bridge request failed: ${response.status}`);
  }
}

function itemStatusToKitchenStatus(status: ItemStatus): KitchenStatus {
  switch (status) {
    case 'PENDING':
      return 'pending';
    case 'PREPARING':
      return 'preparing';
    case 'READY':
    case 'SERVED':
      return 'done';
    default:
      return 'pending';
  }
}

export const wsServer = {
  get isRunning() {
    return running;
  },

  start(): void {
    if (running) return;

    running = true;
    const { host, port } = getBridgeSettings();
    console.info(`[POS-WS] POS bridge client ready at http://${host}:${port}.`);
  },

  stop(): void {
    running = false;
    console.info('[POS-WS] POS bridge client stopped.');
  },

  broadcastOrder(order: Order): void {
    if (!running) {
      console.warn('[POS-WS] Server not running - order not broadcasted.');
      return;
    }

    void postToBridge('/orders/broadcast', { order })
      .then(() => console.info('[POS-WS] Broadcasted order to KDS bridge:', order.orderNumber))
      .catch((error) => console.warn('[POS-WS] Failed to broadcast order to KDS bridge:', error));
  },

  broadcastOrderUpdate(orderId: string, itemStatus: ItemStatus): void {
    if (!running) return;

    const kitchenStatus = itemStatusToKitchenStatus(itemStatus);
    console.info('[POS-WS] Local order update bridge not implemented yet:', orderId, kitchenStatus);
  },
};
