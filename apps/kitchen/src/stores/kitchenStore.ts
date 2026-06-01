// apps/kitchen/src/stores/kitchenStore.ts
import { create } from 'zustand';
import type { KitchenTicket, KitchenTicketItem } from '../types/kitchen';
import { getTimerState } from '../utils/timer';

interface KitchenState {
  tickets: KitchenTicket[];
  addTicket: (ticket: KitchenTicket) => void;
  toggleItemDone: (orderId: string, itemIndex: number) => void;
  removeTicket: (orderId: string) => void;
  updateTimers: () => void;
  getTicket: (orderId: string) => KitchenTicket | undefined;
}

export const useKitchenStore = create<KitchenState>((set, get) => ({
  tickets: [],

  addTicket: (ticket) => {
    set((state) => ({
      tickets: [ticket, ...state.tickets],
    }));
  },

  toggleItemDone: (orderId, itemIndex) => {
    set((state) => ({
      tickets: state.tickets.map((ticket) => {
        if (ticket.orderId !== orderId) return ticket;

        const newItems = ticket.items.map((item, idx) => {
          if (idx !== itemIndex) return item;
          return {
            ...item,
            done: !item.done,
            doneAt: !item.done ? new Date().toISOString() : undefined,
          };
        });

        const allDone = newItems.every((item) => item.done);

        return {
          ...ticket,
          items: newItems,
          allDone,
        };
      }),
    }));
  },

  removeTicket: (orderId) => {
    set((state) => ({
      tickets: state.tickets.filter((t) => t.orderId !== orderId),
    }));
  },

  updateTimers: () => {
    set((state) => ({
      tickets: state.tickets.map((ticket) => {
        const timer = getTimerState(ticket.orderedAt);
        return {
          ...ticket,
          elapsedMinutes: timer.minutes,
        };
      }),
    }));
  },

  getTicket: (orderId) => {
    return get().tickets.find((t) => t.orderId === orderId);
  },
}));
