// packages/ws/src/server.ts
import {
  type WSMessage,
  type ItemDonePayload,
  type OrderDonePayload,
  type StationRegisterPayload,
  createOrderCreated,
  createOrderUpdated,
  createPong,
  ItemUndonePayload,
} from './protocol';
import type { Order, KitchenStatus } from '@mat-ai/types';

// ============================================================
// WS TYPES — Use ws package types, NOT DOM WebSocket
// ============================================================
import type { WebSocket as WsWebSocket, WebSocketServer } from 'ws';

export interface ConnectedStation {
  id: string;
  name: string;
  categories: string[];
  deviceType: string;
  ws: WsWebSocket;  // ← ws package WebSocket
  connectedAt: string;
}

export interface WSServerOptions {
  port: number;
  onStationConnect?: (station: ConnectedStation) => void;
  onStationDisconnect?: (stationId: string) => void;
  onItemDone?: (payload: ItemDonePayload) => void;
  onItemUndone?: (payload: ItemUndonePayload) => void;
  onOrderDone?: (payload: OrderDonePayload) => void;
  onOrderCreated?: (order: Order) => void;
}

export class MATaiWSServer {
  private server: WebSocketServer | null = null;
  private stations: Map<string, ConnectedStation> = new Map();
  private options: WSServerOptions;
  private stationCounter = 0;

  constructor(options: WSServerOptions) {
    this.options = options;
  }

  async start(): Promise<void> {
    const { WebSocketServer } = await import('ws');

    this.server = new WebSocketServer({ port: this.options.port });

    // Null check
    if (!this.server) {
      throw new Error('[WSS] Failed to create WebSocket server');
    }

    this.server.on('connection', (ws) => {
      const tempId = `temp-${Date.now()}`;

      ws.on('message', (data: Buffer) => {
        try {
          const msg: WSMessage = JSON.parse(data.toString());
          this.handleMessage(tempId, ws as any, msg);  // Cast ws untuk avoid type conflict
        } catch (err) {
          console.error('[WSS] Invalid message:', err);
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(tempId);
      });

      ws.on('error', (err: Error) => {
        console.error('[WSS] WebSocket error:', err);
      });
    });

    console.log(`[WSS] Server started on port ${this.options.port}`);
  }

  stop(): void {
    this.stations.forEach((station) => {
      station.ws.close();
    });
    this.stations.clear();
    this.server?.close();
    this.server = null;
    console.log('[WSS] Server stopped');
  }

  broadcast(msg: WSMessage, filter?: (station: ConnectedStation) => boolean): void {
    this.stations.forEach((station) => {
      if (filter && !filter(station)) return;
      if (station.ws.readyState === 1) { // OPEN = 1
        station.ws.send(JSON.stringify(msg));
      }
    });
  }

  broadcastOrderCreated(order: Order): void {
    const msg = createOrderCreated(order);
    const orderCategories = new Set(
      order.items
        .map((i) => i.menuItem?.categoryId)
        .filter((cat): cat is string => !!cat)
    );

    this.broadcast(msg, (station) => {
      if (station.categories.length === 0) return true;
      return station.categories.some((cat) => orderCategories.has(cat));
    });
  }

  broadcastOrderUpdated(orderId: string, status: KitchenStatus, kitchenStatus: KitchenStatus): void {
    const msg = createOrderUpdated(orderId, status, kitchenStatus);
    this.broadcast(msg);
  }

  getStations(): ConnectedStation[] {
    return Array.from(this.stations.values());
  }

  private handleMessage(tempId: string, ws: WsWebSocket, msg: WSMessage): void {
    switch (msg.type) {
      case 'STATION_REGISTER': {
        const payload = msg.payload as StationRegisterPayload;
        this.stationCounter++;
        const stationId = `station-${this.stationCounter}`;

        const station: ConnectedStation = {
          id: stationId,
          name: payload.stationName,
          categories: payload.categories,
          deviceType: payload.deviceType,
          ws,  // ← ws is WsWebSocket (ws package type)
          connectedAt: new Date().toISOString(),
        };

        this.stations.delete(tempId);
        this.stations.set(stationId, station);

        console.log(`[WSS] Station registered: ${station.name} (${stationId})`);
        this.options.onStationConnect?.(station);
        break;
      }

      case 'ITEM_DONE': {
        const payload = msg.payload as ItemDonePayload;
        console.log(`[WSS] Item done: order=${payload.orderId}, item=${payload.itemIndex}`);
        this.options.onItemDone?.(payload);
        this.broadcast(msg);
        break;
      }

      case 'ITEM_UNDONE': {
        const payload = msg.payload as ItemUndonePayload;
        console.log(`[WSS] Item undone: order=${payload.orderId}, item=${payload.itemIndex}`);
        this.options.onItemUndone?.(payload);
        this.broadcast(msg);
        break;
      }

      case 'ORDER_DONE': {
        const payload = msg.payload as OrderDonePayload;
        console.log(`[WSS] Order done: ${payload.orderId}`);
        this.options.onOrderDone?.(payload);
        this.broadcast(msg);
        break;
      }

      case 'PING': {
        ws.send(JSON.stringify(createPong()));
        break;
      }

      default:
        console.log('[WSS] Unknown message type:', msg.type);
    }
  }

  private handleDisconnect(tempId: string): void {
    for (const [id, station] of this.stations) {
      if (id === tempId || station.ws.readyState !== 1) {
        console.log(`[WSS] Station disconnected: ${station.name} (${id})`);
        this.options.onStationDisconnect?.(id);
        this.stations.delete(id);
      }
    }
  }
}