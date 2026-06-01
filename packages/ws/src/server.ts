// packages/ws/src/server.ts
// MAT.ai POS WebSocket Server (runs inside POS app)

import {
  type WSMessage,
  type OrderCreatedPayload,
  type ItemDonePayload,
  type OrderDonePayload,
  type StationRegisterPayload,
  createOrderCreated,
  createOrderUpdated,
  createPong,
} from './protocol';
import type { Order, KitchenStatus } from '@mat-ai/types';

export interface ConnectedStation {
  id: string;
  name: string;
  categories: string[];
  deviceType: string;
  ws: WebSocket;
  connectedAt: string;
}

export interface WSServerOptions {
  port: number;
  onStationConnect?: (station: ConnectedStation) => void;
  onStationDisconnect?: (stationId: string) => void;
  onItemDone?: (payload: ItemDonePayload) => void;
  onOrderDone?: (payload: OrderDonePayload) => void;
  onOrderCreated?: (order: Order) => void;
}

export class MATaiWSServer {
  private server: ReturnType<typeof import('ws')['Server']> | null = null;
  private stations: Map<string, ConnectedStation> = new Map();
  private options: WSServerOptions;
  private stationCounter = 0;

  constructor(options: WSServerOptions) {
    this.options = options;
  }

  async start(): Promise<void> {
    // Dynamic import ws to avoid bundling issues in browser
    const { Server } = await import('ws');

    this.server = new Server({ port: this.options.port });

    this.server.on('connection', (ws: WebSocket) => {
      const tempId = `temp-${Date.now()}`;

      ws.on('message', (data: Buffer) => {
        try {
          const msg: WSMessage = JSON.parse(data.toString());
          this.handleMessage(tempId, ws, msg);
        } catch (err) {
          console.error('[WSS] Invalid message:', err);
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(tempId);
      });

      ws.on('error', (err) => {
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
    console.log('[WSS] Server stopped');
  }

  broadcast(msg: WSMessage, filter?: (station: ConnectedStation) => boolean): void {
    this.stations.forEach((station) => {
      if (filter && !filter(station)) return;
      if (station.ws.readyState === WebSocket.OPEN) {
        station.ws.send(JSON.stringify(msg));
      }
    });
  }

  broadcastOrderCreated(order: Order): void {
    const msg = createOrderCreated(order);
    // Send to all KDS stations that handle this order's categories
    const orderCategories = new Set(order.items.map((i) => i.categoryId));

    this.broadcast(msg, (station) => {
      // If station has no categories filter, send all
      if (station.categories.length === 0) return true;
      // Otherwise check if any item category matches station categories
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

  private handleMessage(tempId: string, ws: WebSocket, msg: WSMessage): void {
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
          ws,
          connectedAt: new Date().toISOString(),
        };

        // Replace temp connection with registered station
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
        // Broadcast to all stations so they can update UI
        this.broadcast(msg);
        break;
      }

      case 'ORDER_DONE': {
        const payload = msg.payload as OrderDonePayload;
        console.log(`[WSS] Order done: ${payload.orderId}`);
        this.options.onOrderDone?.(payload);
        // Broadcast to all stations
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
    // Find station by tempId or ws reference
    for (const [id, station] of this.stations) {
      if (id === tempId || station.ws.readyState !== WebSocket.OPEN) {
        console.log(`[WSS] Station disconnected: ${station.name} (${id})`);
        this.options.onStationDisconnect?.(id);
        this.stations.delete(id);
      }
    }
  }
}
