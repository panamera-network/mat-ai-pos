import type { Order, KitchenStatus, ItemStatus } from '@mat-ai/types';

let running = false;
let bridgeSocket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let intentionallyStopped = false;

type KitchenBridgeEvent =
  | { type: 'ITEM_DONE'; payload: { orderId: string; itemIndex: number; stationId?: string } }
  | { type: 'ITEM_UNDONE'; payload: { orderId: string; itemIndex: number; stationId?: string } }
  | { type: 'ORDER_DONE'; payload: { orderId: string; stationId?: string; completedAt?: string } };

const kitchenEventListeners = new Set<(event: KitchenBridgeEvent) => void>();

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

function getBridgeWsUrl(): string {
  const { host, port } = getBridgeSettings();
  return `ws://${host}:${port}`;
}

function notifyKitchenEvent(event: KitchenBridgeEvent): void {
  kitchenEventListeners.forEach((listener) => listener(event));
}

function scheduleReconnect(): void {
  if (intentionallyStopped || reconnectTimer) return;

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectToBridge();
  }, 3000);
}

function connectToBridge(): void {
  if (!running) return;
  if (bridgeSocket?.readyState === WebSocket.OPEN || bridgeSocket?.readyState === WebSocket.CONNECTING) return;

  const url = getBridgeWsUrl();
  try {
    bridgeSocket = new WebSocket(url);

    bridgeSocket.onopen = () => {
      console.info('[POS-WS] Connected to KDS bridge:', url);
      bridgeSocket?.send(JSON.stringify({
        type: 'STATION_REGISTER',
        payload: {
          stationName: 'POS',
          categories: ['pos'],
          deviceType: 'desktop',
        },
        timestamp: new Date().toISOString(),
      }));
    };

    bridgeSocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message?.type === 'ITEM_DONE' || message?.type === 'ITEM_UNDONE' || message?.type === 'ORDER_DONE') {
          notifyKitchenEvent(message as KitchenBridgeEvent);
        }
      } catch (error) {
        console.warn('[POS-WS] Failed to parse bridge message:', error);
      }
    };

    bridgeSocket.onclose = () => {
      bridgeSocket = null;
      scheduleReconnect();
    };

    bridgeSocket.onerror = (error) => {
      console.warn('[POS-WS] Bridge listener error. Retrying...', error);
    };
  } catch (error) {
    console.warn('[POS-WS] Failed to connect to bridge listener:', error);
    scheduleReconnect();
  }
}

export const wsServer = {
  get isRunning() {
    return running;
  },

  start(): void {
    if (running) return;

    running = true;
    intentionallyStopped = false;
    const { host, port } = getBridgeSettings();
    console.info(`[POS-WS] POS bridge client ready at http://${host}:${port}.`);
    connectToBridge();
  },

  stop(): void {
    intentionallyStopped = true;
    running = false;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    bridgeSocket?.close();
    bridgeSocket = null;
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

  onKitchenEvent(listener: (event: KitchenBridgeEvent) => void): () => void {
    kitchenEventListeners.add(listener);
    return () => kitchenEventListeners.delete(listener);
  },
};
