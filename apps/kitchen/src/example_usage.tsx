// apps/kitchen/src/App.tsx — EXAMPLE USAGE
import { useKitchenWebSocket } from './hooks/useKitchenWebSocket';
import type { KitchenTicket } from './types/kitchen';
import { addToHistory } from './utils/storage';

function KitchenApp() {
  const [tickets, setTickets] = useState<KitchenTicket[]>([]);

  const { isConnected, sendItemDone, sendOrderDone } = useKitchenWebSocket({
    onNewOrder: (msg) => {
      // NEW_ORDER from POS — create ticket
      const order = msg.payload.order;
      const ticket: KitchenTicket = {
        orderId: order.id,
        tableNumber: order.table?.number,
        orderType: order.type,
        customerName: order.customerInfo?.name,
        orderedAt: order.createdAt,
        items: order.items.map((item) => ({
          ...item,
          done: false,
        })),
        elapsedMinutes: 0,
        allDone: false,
      };
      setTickets((prev) => [...prev, ticket]);
      // Play sound if enabled...
    },

    onOrderCreated: (msg) => {
      // Fallback / legacy — same as NEW_ORDER
      console.log('[KDS] Order created:', msg.payload.order.id);
    },

    onOrderUpdated: (msg) => {
      // Update ticket status
      console.log('[KDS] Order updated:', msg.payload.orderId, msg.payload.kitchenStatus);
    },

    onItemDone: (msg) => {
      const { orderId, itemIndex } = msg.payload;
      setTickets((prev) =>
        prev.map((ticket) => {
          if (ticket.orderId !== orderId) return ticket;
          const updatedItems = ticket.items.map((item, idx) =>
            idx === itemIndex ? { ...item, done: true, doneAt: new Date().toISOString() } : item
          );
          const allDone = updatedItems.every((i) => i.done);
          return { ...ticket, items: updatedItems, allDone };
        })
      );
    },

    onOrderDone: (msg) => {
      const { orderId } = msg.payload;
      setTickets((prev) => {
        const ticket = prev.find((t) => t.orderId === orderId);
        if (ticket) {
          // Save to local history
          addToHistory({
            id: ticket.orderId,
            tableNumber: ticket.tableNumber,
            orderType: ticket.orderType,
            items: ticket.items.map((i) => ({ name: i.name, qty: i.quantity, done: i.done })),
            completedAt: new Date().toISOString(),
            elapsedMinutes: ticket.elapsedMinutes,
            stationName: 'KDS',
          });
        }
        return prev.filter((t) => t.orderId !== orderId);
      });
    },
  });

  const handleItemDone = (orderId: string, itemIndex: number) => {
    sendItemDone(orderId, itemIndex);
  };

  const handleOrderDone = (orderId: string) => {
    sendOrderDone(orderId);
  };

  // ... render tickets
}