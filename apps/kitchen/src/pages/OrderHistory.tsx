// apps/kitchen/src/pages/OrderHistory.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Clock, Search, Calendar } from 'lucide-react';
import { getHistory, clearHistory } from '../utils/storage';
import type { HistoryOrder } from '../types/kitchen';

export const OrderHistory: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [history, setHistory] = useState<HistoryOrder[]>(getHistory);

  const filteredHistory = history.filter((order) => {
    const query = searchQuery.toLowerCase();
    return (
      order.tableNumber?.toLowerCase().includes(query) ||
      order.orderType.toLowerCase().includes(query) ||
      order.items.some((item) => item.name.toLowerCase().includes(query))
    );
  });

  const handleClear = () => {
    if (confirm('Hapus semua history order?')) {
      clearHistory();
      setHistory([]);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('ms-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="font-bold text-gray-900">Order History</h1>
        </div>
        <button
          onClick={handleClear}
          className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Clear All
        </button>
      </header>

      {/* Search */}
      <div className="px-4 py-3 bg-white border-b">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search table, type, or item..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        </div>
      </div>

      {/* History List */}
      <main className="flex-1 overflow-auto p-4">
        {filteredHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <Calendar className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">No history</p>
            <p className="text-sm">Completed orders will appear here</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-3">
            {filteredHistory.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900">
                        {order.tableNumber ? `Table ${order.tableNumber}` : `#${order.id.slice(-6)}`}
                      </h3>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full capitalize">
                        {order.orderType}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(order.completedAt)}
                      <span className="mx-1">•</span>
                      {order.elapsedMinutes}m elapsed
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <span className="text-gray-900">{item.qty} x {item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
