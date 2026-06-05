// apps/kitchen/src/types/kitchen.ts
// KDS-specific types

import type { OrderItem } from '@mat-ai/types';

export type KitchenOrderType = 'dine-in' | 'takeaway' | 'delivery' | 'reservation';

export interface KitchenTicketItem extends OrderItem {
  done: boolean;
  doneAt?: string;
}

export interface KitchenTicket {
  orderId: string;
  tableNumber?: string;
  orderType: string;
  customerName?: string;
  orderedAt: string;
  items: KitchenTicketItem[];
  elapsedMinutes: number;
  allDone: boolean;
}

export interface HistoryOrder {
  id: string;
  tableNumber?: string;
  orderType: string;
  items: { name: string; qty: number; done: boolean }[];
  completedAt: string;
  elapsedMinutes: number;
  stationName: string;
}

export interface KdsSettings {
  posIp: string;
  posPort: number;
  soundEnabled: boolean;
  soundVolume: number;
}

export type TimerColor = 'green' | 'yellow' | 'red';

export interface TimerState {
  minutes: number;
  color: TimerColor;
}
