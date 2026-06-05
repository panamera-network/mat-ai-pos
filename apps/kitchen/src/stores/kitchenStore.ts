// apps/kitchen/src/stores/kitchenStore.ts
import { create } from 'zustand';
import type { KitchenTicket, KitchenTicketItem } from '../types/kitchen';
import { getTimerState } from '../utils/timer';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:4000';

interface KitchenState {
  tickets: KitchenTicket[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchTickets: () => Promise<void>;
  toggleItemDone: (orderId: string, itemId: string) => Promise<void>;
  removeTicket: (orderId: string) => Promise<void>;
  updateTimers: () => void;
  getTicket: (orderId: string) => KitchenTicket | undefined;
}

// Transform backend Order → KitchenTicket
const transformOrder = (order: any): KitchenTicket => ({
  orderId: order.id,
  tableNumber: order.table?.number || null,
  orderType: order.type?.toLowerCase().replace('_', '-') || 'dine-in',
  customerName: order.customerName || undefined,
  orderedAt: order.createdAt,
  items: order.items.map((item: any) => ({
    id: item.id, // Backend item ID
    menuItemId: item.menuItemId,
    name: item.name,
    qty: item.quantity,
    done: item.status === 'READY' || item.status === 'SERVED',
    doneAt: item.status === 'READY' ? new Date().toISOString() : undefined,
    modifiers: item.options ? Object.keys(item.options) : [],
    notes: item.notes,
  })),
  elapsedMinutes: 0,
  allDone: order.items.every((i: any) => i.status === 'READY' || i.status === 'SERVED'),
});

export const useKitchenStore = create<KitchenState>((set, get) => ({
  tickets: [],
  isLoading: false,
  error: null,

  fetchTickets: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/orders/kitchen/queue`);
      if (!res.ok) throw new Error('Failed to fetch kitchen queue');
      
      const orders = await res.json();
      const tickets = orders.map(transformOrder);
      
      set({ tickets, isLoading: false });
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
      set({ error: err instanceof Error ? err.message : 'Unknown error', isLoading: false });
    }
  },

  toggleItemDone: async (orderId, itemId) => {
    // Optimistic update
    set((state) => ({
      tickets: state.tickets.map((ticket) => {
        if (ticket.orderId !== orderId) return ticket;

        const newItems = ticket.items.map((item) => {
          if (item.id !== itemId) return item;
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

    // Sync to backend
    try {
      const ticket = get().tickets.find((t) => t.orderId === orderId);
      const item = ticket?.items.find((i) => i.id === itemId);
      if (!item) return;

      await fetch(`${API_URL}/orders/items/${itemId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: item.done ? 'READY' : 'PENDING' }),
      });
    } catch (err) {
      console.error('Failed to update item status:', err);
    }
  },

  removeTicket: async (orderId) => {
    // Mark order as SERVED in backend
    try {
      await fetch(`${API_URL}/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'SERVED' }),
      });
    } catch (err) {
      console.error('Failed to update order status:', err);
    }

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