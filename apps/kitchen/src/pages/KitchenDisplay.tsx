// apps/kitchen/src/pages/KitchenDisplay.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, History, ChefHat, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useKitchenStore } from '../stores/kitchenStore';
import { useSound } from '../hooks/useSound';
import { useTimer } from '../hooks/useTimer';
import { addToHistory } from '../utils/storage';
import { getTimerState } from '../utils/timer';
import type { KitchenTicket } from '../types/kitchen';
import { OrderCard } from '../components/OrderCard';
import { ConnectionStatus } from '../components/ConnectionStatus';

const CARDS_PER_PAGE = 4;
const POLL_INTERVAL = 5000; // 5 seconds

export const KitchenDisplay: React.FC = () => {
  const navigate = useNavigate();
  const { playNewOrder, playDone } = useSound();
  const previousTicketCount = useRef(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [isConnected, setIsConnected] = useState(true); // API polling = always "connected"
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const tickets = useKitchenStore((state) => state.tickets);
  const isLoading = useKitchenStore((state) => state.isLoading);
  const fetchTickets = useKitchenStore((state) => state.fetchTickets);
  const toggleItemDone = useKitchenStore((state) => state.toggleItemDone);
  const removeTicket = useKitchenStore((state) => state.removeTicket);

  // Start timer updates
  useTimer(30000);

  // Polling effect
  useEffect(() => {
    fetchTickets(); // Initial fetch
    
    const interval = setInterval(() => {
      fetchTickets();
    }, POLL_INTERVAL);
    
    return () => clearInterval(interval);
  }, [fetchTickets]);

  // Calculate pagination
  const totalPages = Math.max(1, Math.ceil(tickets.length / CARDS_PER_PAGE));
  const currentTickets = tickets.slice(
    currentPage * CARDS_PER_PAGE,
    (currentPage + 1) * CARDS_PER_PAGE
  );

  // Reset to page 0 if current page is out of bounds
  useEffect(() => {
    if (currentPage >= totalPages && totalPages > 0) {
      setCurrentPage(totalPages - 1);
    }
  }, [tickets.length, currentPage, totalPages]);

  // Play sound when new orders arrive
  useEffect(() => {
    if (tickets.length > previousTicketCount.current) {
      playNewOrder();
    }
    previousTicketCount.current = tickets.length;
  }, [tickets.length, playNewOrder]);

  const handleToggleItem = useCallback((orderId: string, itemId: string) => {
    toggleItemDone(orderId, itemId);
  }, [toggleItemDone]);

  const handleDone = useCallback((orderId: string) => {
    const ticket = tickets.find((t) => t.orderId === orderId);
    if (!ticket || !ticket.allDone) return;

    addToHistory({
      id: ticket.orderId,
      tableNumber: ticket.tableNumber,
      orderType: ticket.orderType,
      items: ticket.items.map((i) => ({ name: i.name, qty: i.qty, done: i.done })),
      completedAt: new Date().toISOString(),
      elapsedMinutes: getTimerState(ticket.orderedAt).minutes,
      stationName: 'Main Kitchen',
    });

    playDone();
    removeTicket(orderId);
  }, [tickets, removeTicket, playDone]);

  // Swipe handlers
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
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-lg">Kitchen Display</h1>
            <p className="text-xs text-gray-500">{tickets.length} active orders</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ConnectionStatus isConnected={isConnected} stationName="Main Kitchen" />
          <button
            onClick={() => fetchTickets()}
            disabled={isLoading}
            className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-600 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => navigate('/history')}
            className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-600"
            title="Order History"
          >
            <History className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-600"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Cards Container */}
      <main
        className="flex-1 p-4 min-h-0 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {tickets.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <ChefHat className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">No active orders</p>
            <p className="text-sm">Waiting for new orders...</p>
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
              <div key={`empty-${i}`} className="flex-1 min-w-0 h-full rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50" style={{ maxWidth: 'calc(25% - 12px)' }} />
            ))}
          </div>
        )}
      </main>

      {/* Pagination Footer */}
      <footer className="bg-white border-t px-4 py-3 flex items-center justify-center gap-4 flex-shrink-0">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 0}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        <div className="flex items-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => goToPage(i)}
              className={`
                w-8 h-8 rounded-lg text-sm font-medium transition-colors
                ${i === currentPage
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages - 1}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </footer>
    </div>
  );
};