// apps/kitchen/src/utils/mockWebSocket.ts
// Mock WebSocket server for demo - simulates POS sending orders

import type { Order, OrderItem, KitchenStatus } from '@mat-ai/types';
import { createOrderCreated } from '@mat-ai/ws';
import type { WSMessage } from '@mat-ai/ws';

interface MockOrder {
  id: string;
  tableNumber?: string;
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  customerName?: string;
  items: OrderItem[];
  orderedAt: string;
}

const MOCK_ORDERS: MockOrder[] = [
  {
    id: 'ord-001',
    tableNumber: '3',
    orderType: 'dine-in',
    customerName: 'Margareth',
    items: [
      { menuItemId: 'm1', name: 'Margherita Pizza', categoryId: 'Pizza', qty: 1, price: 28, modifiers: [{ modifierId: 'mod1', name: 'Extra cheese', price: 3 }], subtotal: 31, notes: '' },
      { menuItemId: 'm2', name: 'Caesar Salad', categoryId: 'Side Order', qty: 1, price: 18, modifiers: [], subtotal: 18 },
      { menuItemId: 'm3', name: 'Tomato Soup', categoryId: 'Side Order', qty: 1, price: 12, modifiers: [], subtotal: 12 },
    ],
    orderedAt: new Date(Date.now() - 8 * 60000).toISOString(), // 8 min ago
  },
  {
    id: 'ord-002',
    orderType: 'takeaway',
    customerName: 'Sophia L.',
    items: [
      { menuItemId: 'm4', name: 'Chicken Sandwich', categoryId: 'Side Order', qty: 2, price: 22, modifiers: [{ modifierId: 'mod2', name: 'No mayo', price: 0 }], subtotal: 44, notes: '' },
      { menuItemId: 'm5', name: 'Fries', categoryId: 'Side Order', qty: 1, price: 10, modifiers: [{ modifierId: 'mod3', name: 'Large', price: 3 }], subtotal: 13, notes: '' },
      { menuItemId: 'm6', name: 'Iced Tea', categoryId: 'Beverages', qty: 2, price: 6, modifiers: [], subtotal: 12 },
    ],
    orderedAt: new Date(Date.now() - 18 * 60000).toISOString(), // 18 min ago
  },
  {
    id: 'ord-003',
    orderType: 'delivery',
    customerName: 'Daniel K.',
    items: [
      { menuItemId: 'm7', name: 'Spaghetti Bolognese', categoryId: 'Pasta', qty: 2, price: 32, modifiers: [{ modifierId: 'mod4', name: 'Extra sauce', price: 2 }], subtotal: 68, notes: '' },
      { menuItemId: 'm8', name: 'Caesar salad', categoryId: 'Side Order', qty: 1, price: 18, modifiers: [], subtotal: 18 },
      { menuItemId: 'm9', name: 'Garlic Bread', categoryId: 'Side Order', qty: 1, price: 8, modifiers: [], subtotal: 8 },
    ],
    orderedAt: new Date(Date.now() - 5 * 60000).toISOString(), // 5 min ago
  },
  {
    id: 'ord-004',
    tableNumber: '2',
    orderType: 'dine-in',
    customerName: 'Marta',
    items: [
      { menuItemId: 'm10', name: 'Beef Burger', categoryId: 'Side Order', qty: 2, price: 26, modifiers: [{ modifierId: 'mod5', name: 'Medium rare', price: 0 }], subtotal: 52, notes: '' },
      { menuItemId: 'm11', name: 'Chicken Alfredo Pasta', categoryId: 'Pasta', qty: 1, price: 30, modifiers: [], subtotal: 30 },
      { menuItemId: 'm12', name: 'French Fries', categoryId: 'Side Order', qty: 1, price: 10, modifiers: [{ modifierId: 'mod3', name: 'Large', price: 3 }], subtotal: 13, notes: '' },
      { menuItemId: 'm13', name: 'Lemonade', categoryId: 'Beverages', qty: 1, price: 7, modifiers: [], subtotal: 7 },
    ],
    orderedAt: new Date(Date.now() - 28 * 60000).toISOString(), // 28 min ago
  },
];

export class MockWebSocketServer {
  private listeners: Set<(msg: WSMessage) => void> = new Set();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private orderIndex = 0;

  connect(): void {
    console.log('[MockWS] Connected to demo server');

    // Send initial orders with delay
    MOCK_ORDERS.forEach((order, idx) => {
      setTimeout(() => {
        this.broadcastOrder(order);
      }, 500 + idx * 300);
    });

    // Auto-generate new order every 60 seconds
    this.intervalId = setInterval(() => {
      this.generateRandomOrder();
    }, 60000);
  }

  disconnect(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('[MockWS] Disconnected');
  }

  onMessage(handler: (msg: WSMessage) => void): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  send(msg: WSMessage): void {
    // Mock server receives messages from KDS (item done, order done)
    console.log('[MockWS] Received:', msg.type);
  }

  private broadcast(msg: WSMessage): void {
    this.listeners.forEach((handler) => handler(msg));
  }

  private broadcastOrder(mockOrder: MockOrder): void {
    const order: Order = {
      id: mockOrder.id,
      items: mockOrder.items,
      orderType: mockOrder.orderType,
      tableNumber: mockOrder.tableNumber,
      customerName: mockOrder.customerName,
      subtotal: mockOrder.items.reduce((sum, i) => sum + i.subtotal, 0),
      total: mockOrder.items.reduce((sum, i) => sum + i.subtotal, 0),
      finalTotal: mockOrder.items.reduce((sum, i) => sum + i.subtotal, 0),
      status: 'pending',
      kitchenStatus: 'pending',
      cashierId: 'staff-1',
      cashierName: 'Cashier',
      orderedAt: mockOrder.orderedAt,
      isQrOrder: false,
      createdAt: mockOrder.orderedAt,
      updatedAt: mockOrder.orderedAt,
    };

    const msg = createOrderCreated(order);
    this.broadcast(msg);
  }

  private generateRandomOrder(): void {
    const items = [
      { menuItemId: 'm1', name: 'Margherita Pizza', categoryId: 'Pizza', qty: 1, price: 28, modifiers: [], subtotal: 28, notes: '' },
      { menuItemId: 'm7', name: 'Spaghetti Bolognese', categoryId: 'Pasta', qty: 1, price: 32, modifiers: [], subtotal: 32, notes: '' },
      { menuItemId: 'm10', name: 'Beef Burger', categoryId: 'Side Order', qty: 1, price: 26, modifiers: [], subtotal: 26, notes: '' },
    ];

    const randomItem = items[Math.floor(Math.random() * items.length)];

    const newOrder: MockOrder = {
      id: `ord-${Date.now()}`,
      tableNumber: Math.random() > 0.5 ? `${Math.floor(Math.random() * 20) + 1}` : undefined,
      orderType: ['dine-in', 'takeaway', 'delivery'][Math.floor(Math.random() * 3)] as any,
      customerName: ['Ahmad', 'Siti', 'Ali', 'Nurul'][Math.floor(Math.random() * 4)],
      items: [randomItem],
      orderedAt: new Date().toISOString(),
    };

    this.broadcastOrder(newOrder);
  }
}
