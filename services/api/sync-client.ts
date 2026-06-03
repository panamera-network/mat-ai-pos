/**
 * @mat-ai/sync-client
 * Universal Socket.IO + REST client for POS, KDS, QR Menu
 * Connects to NestJS backend at :4000
 */

import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:4000';

export type AppRoom = 'pos' | 'kds' | 'qr';

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  source: string;
  totalAmount: number;
  items: OrderItem[];
  tableId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: string;
  options?: Record<string, any>;
  notes?: string;
}

class MatSyncClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  get isConnected() {
    return this.socket?.connected ?? false;
  }

  connect(room: AppRoom) {
    if (this.socket?.connected) return;

    this.socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on('connect', () => {
      console.log('🟢 Connected to MAT.ai backend');
      this.reconnectAttempts = 0;
      // Join app-specific room
      this.socket?.emit('joinRoom', room);
      this.emit('connected', { socketId: this.socket.id });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔴 Disconnected:', reason);
      this.emit('disconnected', { reason });
    });

    this.socket.on('connect_error', (err) => {
      this.reconnectAttempts++;
      console.error(`Connection error (attempt ${this.reconnectAttempts}):`, err.message);
      this.emit('error', err);
    });

    // ─── Server Events ───
    this.socket.on('order:created', (order: Order) => {
      console.log('📨 New order:', order.orderNumber);
      this.emit('order:created', order);
    });

    this.socket.on('order:updated', (order: Order) => {
      console.log('📨 Order updated:', order.orderNumber, '→', order.status);
      this.emit('order:updated', order);
    });

    this.socket.on('pos:newOrder', (order: Order) => {
      this.emit('pos:newOrder', order);
    });

    this.socket.on('kds:newOrder', (order: Order) => {
      this.emit('kds:newOrder', order);
    });

    this.socket.on('kds:orderPaid', (order: Order) => {
      this.emit('kds:orderPaid', order);
    });

    this.socket.on('pos:orderReady', (order: Order) => {
      this.emit('pos:orderReady', order);
    });

    this.socket.on('qr:orderReady', (order: Order) => {
      this.emit('qr:orderReady', order);
    });

    this.socket.on('sync:orders', (orders: Order[]) => {
      this.emit('sync:orders', orders);
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  // ─── Event System ───

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  off(event: string, callback: (data: any) => void) {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(cb => {
      try { cb(data); } catch (err) { console.error('Listener error:', err); }
    });
  }

  // ─── REST API ───

  async createOrder(orderData: any): Promise<Order> {
    const res = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    if (!res.ok) throw new Error(`Create order failed: ${res.status}`);
    return res.json();
  }

  async getOrders(status?: string): Promise<Order[]> {
    const url = status ? `${API_URL}/orders?status=${status}` : `${API_URL}/orders`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Get orders failed: ${res.status}`);
    return res.json();
  }

  async getOrder(id: string): Promise<Order> {
    const res = await fetch(`${API_URL}/orders/${id}`);
    if (!res.ok) throw new Error(`Get order failed: ${res.status}`);
    return res.json();
  }

  async updateOrder(id: string, updates: any): Promise<Order> {
    const res = await fetch(`${API_URL}/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error(`Update order failed: ${res.status}`);
    return res.json();
  }

  async getKitchenQueue(): Promise<Order[]> {
    const res = await fetch(`${API_URL}/orders/kitchen-queue`);
    if (!res.ok) throw new Error(`Get kitchen queue failed: ${res.status}`);
    return res.json();
  }

  async updateItemStatus(itemId: string, status: string) {
    const res = await fetch(`${API_URL}/orders/items/${itemId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error(`Update item status failed: ${res.status}`);
    return res.json();
  }

  // ─── Socket Emitters ───

  createOrderRealtime(orderData: any) {
    this.socket?.emit('order:create', orderData);
  }

  updateOrderRealtime(id: string, updates: any) {
    this.socket?.emit('order:update', { id, updates });
  }

  updateItemStatusRealtime(itemId: string, status: string) {
    this.socket?.emit('order:itemStatus', { itemId, status });
  }

  requestSync() {
    this.socket?.emit('sync:request', {});
  }
}

// Singleton
export const matSync = new MatSyncClient();
export default MatSyncClient;
