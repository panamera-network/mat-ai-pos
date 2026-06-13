// apps/kitchen/src/pages/OrderHistory.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Clock, Search, Calendar } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, Input, EmptyState } from '@mat-ai/ui';
import { getHistory, clearHistory } from '../utils/storage';
import type { HistoryOrder } from '../types/kitchen';

export const OrderHistory: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [history, setHistory] = useState<HistoryOrder[]>(getHistory);

  const filteredHistory = history.filter((order) => {
    const query = searchQuery.toLowerCase();
    return (
      order.orderNumber?.toLowerCase().includes(query) ||
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
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-bold text-gray-900 dark:text-gray-100">Order History</h1>
        </div>
        <Button variant="danger" size="sm" onClick={handleClear} leftIcon={<Trash2 className="w-4 h-4" />}>
          Clear All
        </Button>
      </header>

      {/* Search */}
      <div className="px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-md">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search table, type, or item..."
            leftIcon={<Search className="w-4 h-4" />}
            fullWidth
          />
        </div>
      </div>

      {/* History List */}
      <main className="flex-1 overflow-auto p-4">
        {filteredHistory.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <EmptyState
              icon={<Calendar className="w-12 h-12 text-gray-400" />}
              title="No history"
              description="Completed orders will appear here"
            />
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-3">
            {filteredHistory.map((order) => (
              <Card key={order.id} padding="md">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 dark:text-gray-100">
                        {order.tableNumber ? `Table ${order.tableNumber}` : `#${order.orderNumber}`}
                      </h3>
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-full capitalize">
                        {order.orderType}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
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
                      <span className={`text-gray-900 dark:text-gray-100 ${item.done ? 'line-through text-gray-400' : ''}`}>
                        {item.qty} x {item.name}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};