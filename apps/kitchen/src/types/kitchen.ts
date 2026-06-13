// apps/kitchen/src/types/kitchen.ts
// KDS-specific types ONLY — everything else from @mat-ai/types

import type { OrderItem } from '@mat-ai/types';

// ============ KDS-ONLY TYPES (not in Prisma / shared) ============

/** KDS ticket item extends OrderItem with done tracking */
export interface KitchenTicketItem extends OrderItem {
  done: boolean;
  doneAt?: string;
}

/** Live ticket displayed on KDS screen */
export interface KitchenTicket {
  orderId: string;
  orderNumber: string;
  tableNumber?: string;
  orderType: string;
  customerName?: string;
  orderedAt: string;
  items: KitchenTicketItem[];
  elapsedMinutes: number;
  allDone: boolean;
}

/** Saved to localStorage when order completed */
export interface HistoryOrder {
  id: string;
  orderNumber: string;
  tableNumber?: string;
  orderType: string;
  items: { name: string; qty: number; done: boolean }[];
  completedAt: string;
  elapsedMinutes: number;
  stationName: string;
}

/** KDS app settings (localStorage) */
export interface KdsSettings {
  posIp: string;
  posPort: number;
  stationName: string;
  soundEnabled: boolean;
  soundVolume: number;
}

/** Timer color for UI */
export type TimerColor = 'green' | 'yellow' | 'red';

export interface TimerState {
  minutes: number;
  color: TimerColor;
}