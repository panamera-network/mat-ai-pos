// apps/kitchen/src/stores/kitchenStore.ts
// WS-driven Zustand store

import { create } from 'zustand';
import type { Order } from '@mat-ai/types';
import type { KitchenTicket, KitchenTicketItem } from '../types/kitchen';
import { getTimerState } from '../utils/timer';

interface KitchenState {
  tickets: KitchenTicket[];
  isLoading: boolean;
  error: string | null;

  // Actions
  addTicket: (order: Order) => void;
  toggleItemDone: (orderId: string, itemId: string) => void;
  updateItemDoneFromWS: (orderId: string, itemIndex: number) => void;
  updateItemUndoneFromWS: (orderId: string, itemIndex: number) => void;
  removeTicket: (orderId: string) => void;
  updateTimers: () => void;
  getTicket: (orderId: string) => KitchenTicket | undefined;
  isAllDone: (orderId: string) => boolean;
}

function transformOrder(order: Order): KitchenTicket {
  return {
    orderId: order.id,
    orderNumber: order.orderNumber || order.id.slice(-4),
    tableNumber: order.table?.number,
    orderType: order.type?.toLowerCase().replace('_', '-') || 'dine-in',
    customerName: order.customerInfo?.name,
    orderedAt: order.createdAt,
    items: order.items.map((item): KitchenTicketItem => ({
      ...item,
      done: false,
      doneAt: undefined,
    })),
    elapsedMinutes: 0,
    allDone: false,
  };
}

export const useKitchenStore = create<KitchenState>((set, get) => ({
  tickets: [],
  isLoading: false,
  error: null,

  addTicket: (order: Order) => {
    set((state) => {
      if (state.tickets.some((t) => t.orderId === order.id)) {
        return state;
      }
      const ticket = transformOrder(order);
      return { tickets: [...state.tickets, ticket] };
    });
  },

  toggleItemDone: (orderId: string, itemId: string) => {
    set((state) => ({
      tickets: state.tickets.map((ticket) => {
        if (ticket.orderId !== orderId) return ticket;

        const newItems = ticket.items.map((item) => {
          if (item.id !== itemId) return item;
          const newDone = !item.done;
          return {
            ...item,
            done: newDone,
            doneAt: newDone ? new Date().toISOString() : undefined,
          };
        });

        const allDone = newItems.every((item) => item.done);

        return { ...ticket, items: newItems, allDone };
      }),
    }));
  },

  updateItemDoneFromWS: (orderId: string, itemIndex: number) => {
    set((state) => ({
      tickets: state.tickets.map((ticket) => {
        if (ticket.orderId !== orderId) return ticket;
        const newItems = ticket.items.map((item, idx) =>
          idx === itemIndex ? { ...item, done: true, doneAt: new Date().toISOString() } : item
        );
        const allDone = newItems.every((item) => item.done);
        return { ...ticket, items: newItems, allDone };
      }),
    }));
  },

  updateItemUndoneFromWS: (orderId: string, itemIndex: number) => {
    set((state) => ({
      tickets: state.tickets.map((ticket) => {
        if (ticket.orderId !== orderId) return ticket;
        const newItems = ticket.items.map((item, idx) =>
          idx === itemIndex ? { ...item, done: false, doneAt: undefined } : item
        );
        const allDone = newItems.every((item) => item.done);
        return { ...ticket, items: newItems, allDone };
      }),
    }));
  },

  removeTicket: (orderId: string) => {
    set((state) => ({
      tickets: state.tickets.filter((t) => t.orderId !== orderId),
    }));
  },

  updateTimers: () => {
    set((state) => ({
      tickets: state.tickets.map((ticket) => {
        const timer = getTimerState(ticket.orderedAt);
        return { ...ticket, elapsedMinutes: timer.minutes };
      }),
    }));
  },

  getTicket: (orderId: string) => {
    return get().tickets.find((t) => t.orderId === orderId);
  },

  isAllDone: (orderId: string) => {
    const ticket = get().tickets.find((t) => t.orderId === orderId);
    return ticket?.allDone ?? false;
  },
}));