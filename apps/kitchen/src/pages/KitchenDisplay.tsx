// apps/kitchen/src/pages/KitchenDisplay.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, History, ChefHat, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Button, EmptyState } from '@mat-ai/ui';
import { useKitchenStore } from '../stores/kitchenStore';
import { useKitchenWebSocket } from '../hooks/useKitchenWebSocket';
import { useSound } from '../hooks/useSound';
import { useTimer } from '../hooks/useTimer';
import { addToHistory } from '../utils/storage';
import { getTimerState } from '../utils/timer';
import type { KitchenTicket } from '../types/kitchen';
import { OrderCard } from '../components/OrderCard';
import { ConnectionStatus } from '../components/ConnectionStatus';

const CARDS_PER_PAGE = 4;

export const KitchenDisplay: React.FC = () => {
  const navigate = useNavigate();
  const { playNewOrder, playDone } = useSound();
  const previousTicketCount = useRef(0);
  const [currentPage, setCurrentPage] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const tickets = useKitchenStore((state) => state.tickets);
  const addTicket = useKitchenStore((state) => state.addTicket);
  const toggleItemDone = useKitchenStore((state) => state.toggleItemDone);
  const updateItemDoneFromWS = useKitchenStore((state) => state.updateItemDoneFromWS);
  const updateItemUndoneFromWS = useKitchenStore((state) => state.updateItemUndoneFromWS);
  const removeTicket = useKitchenStore((state) => state.removeTicket);

  useTimer(30000);

  const { isConnected, sendItemDone, sendItemUndone, sendOrderDone } = useKitchenWebSocket({
    onNewOrder: (msg) => {
      addTicket(msg.payload.order);
    },
    onOrderCreated: (msg) => {
      addTicket(msg.payload.order);
    },
    onOrderUpdated: (msg) => {
      console.log('[KDS] Order updated:', msg.payload.orderId, msg.payload.kitchenStatus);
    },
    onItemDone: (msg) => {
      updateItemDoneFromWS(msg.payload.orderId, msg.payload.itemIndex);
    },
    onItemUndone: (msg) => {
      updateItemUndoneFromWS(msg.payload.orderId, msg.payload.itemIndex);
    },
    onOrderDone: (msg) => {
      const ticket = useKitchenStore.getState().getTicket(msg.payload.orderId);
      if (ticket) {
        saveToHistory(ticket);
        removeTicket(msg.payload.orderId);
      }
    },
  });

  useEffect(() => {
    if (tickets.length > previousTicketCount.current) {
      playNewOrder();
    }
    previousTicketCount.current = tickets.length;
  }, [tickets.length, playNewOrder]);

  const totalPages = Math.max(1, Math.ceil(tickets.length / CARDS_PER_PAGE));
  const currentTickets = tickets.slice(
    currentPage * CARDS_PER_PAGE,
    (currentPage + 1) * CARDS_PER_PAGE
  );

  useEffect(() => {
    if (currentPage >= totalPages && totalPages > 0) {
      setCurrentPage(totalPages - 1);
    }
  }, [tickets.length, currentPage, totalPages]);

  const saveToHistory = useCallback((ticket: KitchenTicket) => {
    addToHistory({
      id: ticket.orderId,
      orderNumber: ticket.orderNumber,
      tableNumber: ticket.tableNumber,
      orderType: ticket.orderType,
      items: ticket.items.map((i) => ({ name: i.name, qty: i.quantity, done: i.done })),
      completedAt: new Date().toISOString(),
      elapsedMinutes: getTimerState(ticket.orderedAt).minutes,
      stationName: 'Main Kitchen',
    });
    playDone();
  }, [playDone]);

  const handleToggleItem = useCallback((orderId: string, itemId: string) => {
    const ticket = useKitchenStore.getState().getTicket(orderId);
    if (!ticket) return;

    const itemIndex = ticket.items.findIndex((i) => i.id === itemId);
    if (itemIndex === -1) return;

    const item = ticket.items[itemIndex];
    toggleItemDone(orderId, itemId);

    // Send WS message
    if (item.done) {
      // Item was done, now undone
      sendItemUndone(orderId, itemIndex);
    } else {
      // Item was not done, now done
      sendItemDone(orderId, itemIndex);
    }
  }, [toggleItemDone, sendItemDone, sendItemUndone]);

  const handleDone = useCallback((orderId: string) => {
    const ticket = useKitchenStore.getState().getTicket(orderId);
    if (!ticket || !ticket.allDone) return;

    sendOrderDone(orderId);
    saveToHistory(ticket);
    removeTicket(orderId);
  }, [sendOrderDone, removeTicket, saveToHistory]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;
    if (Math.abs(diff) > threshold) {
      if (diff > 0 && currentPage < totalPages - 1) {
        setCurrentPage((p) => p + 1);
      } else if (diff < 0 && currentPage > 0) {
        setCurrentPage((p) => p - 1);
      }
    }
  };

  const goToPage = (page: number) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-950 overflow-hidden">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Kitchen Display</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{tickets.length} active orders</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ConnectionStatus isConnected={isConnected} stationName="Main Kitchen" />
          <Button variant="ghost" size="sm" onClick={() => window.location.reload()} title="Refresh">
            <RefreshCw className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/history')} title="Order History">
            <History className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/settings')} title="Settings">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main
        className="flex-1 p-4 min-h-0 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {tickets.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <EmptyState
              icon={<ChefHat className="w-12 h-12 text-gray-400" />}
              title="No active orders"
              description="Waiting for new orders from POS..."
            />
          </div>
        ) : (
          <div className="flex flex-row flex-nowrap gap-4 h-full">
            {currentTickets.map((ticket) => (
              <div key={ticket.orderId} className="h-full flex-shrink-0" style={{ width: 'calc(25% - 12px)', minWidth: 'calc(25% - 12px)' }}>
                <OrderCard
                  ticket={ticket}
                  onToggleItem={handleToggleItem}
                  onDone={handleDone}
                />
              </div>
            ))}
            {Array.from({ length: CARDS_PER_PAGE - currentTickets.length }).map((_, i) => (
              <div key={`empty-${i}`} className="flex-1 min-w-0 h-full rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50" style={{ maxWidth: 'calc(25% - 12px)' }} />
            ))}
          </div>
        )}
      </main>

      {totalPages > 1 && (
        <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-center gap-4 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 0}>
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <Button
                key={i}
                variant={i === currentPage ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => goToPage(i)}
                className="w-8 h-8 p-0"
              >
                {i + 1}
              </Button>
            ))}
          </div>

          <Button variant="ghost" size="sm" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages - 1}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </footer>
      )}
    </div>
  );
};