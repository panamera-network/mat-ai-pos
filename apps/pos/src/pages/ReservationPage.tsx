import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Check, Clock, RefreshCw, Search, Users } from 'lucide-react';
import type { DiningTable, Order } from '@mat-ai/types';
import { normalizeBackendOrder } from '../lib/types';
import { wsServer } from '../lib/ws';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const isActiveReservation = (order: Order) =>
  order.type === 'RESERVATION' && !['PAID', 'SERVED', 'CANCELLED'].includes(order.status);

export const ReservationPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [search, setSearch] = useState('');
  const [selectedTableByOrder, setSelectedTableByOrder] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersRes, tablesRes] = await Promise.all([
        fetch(`${API_URL}/orders`),
        fetch(`${API_URL}/tables`),
      ]);
      const ordersData = ordersRes.ok ? await ordersRes.json() : [];
      const tablesData = tablesRes.ok ? await tablesRes.json() : [];
      setOrders(Array.isArray(ordersData) ? ordersData.map(normalizeBackendOrder).filter(isActiveReservation) : []);
      setTables(Array.isArray(tablesData) ? tablesData : []);
    } catch (error) {
      console.error('Failed to load reservations:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const reservationDate = order.reservationTime?.slice(0, 10);
      const matchesDate = !selectedDate || reservationDate === selectedDate;
      const query = search.trim().toLowerCase();
      const matchesSearch = !query || [
        order.orderNumber,
        order.customerInfo?.name,
        order.customerInfo?.phone,
      ].filter(Boolean).some((value) => String(value).toLowerCase().includes(query));
      return matchesDate && matchesSearch;
    });
  }, [orders, search, selectedDate]);

  const availableTables = tables.filter((table) => table.status === 'AVAILABLE');

  const updateLocalTableStatus = (tableId: string, status: DiningTable['status']) => {
    setTables((prev) => prev.map((table) => table.id === tableId ? { ...table, status } : table));
    try {
      const cached = JSON.parse(localStorage.getItem('mat-pos-tables') || '[]');
      const updated = Array.isArray(cached)
        ? cached.map((table) => table.id === tableId ? { ...table, status } : table)
        : [];
      localStorage.setItem('mat-pos-tables', JSON.stringify(updated));
    } catch {
      // best-effort cache
    }
  };

  const assignTableAndSend = async (order: Order) => {
    const tableId = selectedTableByOrder[order.id];
    if (!tableId) {
      alert('Select a table first.');
      return;
    }

    setAssigningId(order.id);
    try {
      const orderRes = await fetch(`${API_URL}/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'DINE_IN',
          status: 'PREPARING',
          tableId,
        }),
      });
      if (!orderRes.ok) throw new Error(`Order update failed: ${orderRes.status}`);
      const updatedOrder = normalizeBackendOrder(await orderRes.json());

      await fetch(`${API_URL}/tables/${tableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'OCCUPIED' }),
      }).catch((error) => console.error('Failed to occupy table:', error));

      updateLocalTableStatus(tableId, 'OCCUPIED');
      if (!wsServer.isRunning) wsServer.start();
      wsServer.broadcastOrder(updatedOrder);
      setOrders((prev) => prev.filter((item) => item.id !== order.id));
    } catch (error) {
      console.error('Failed to assign reservation:', error);
      alert('Failed to assign reservation.');
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <h1 className="font-bold text-gray-900">Reservations</h1>
            <p className="text-xs text-gray-500">Assign table when guests arrive.</p>
          </div>
        </div>
        <button onClick={() => void loadData()} className="p-2 hover:bg-gray-100 rounded-lg" title="Refresh">
          <RefreshCw className="w-5 h-5 text-gray-600" />
        </button>
      </header>

      <main className="flex-1 overflow-auto p-4">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="bg-white border rounded-xl p-4 flex flex-wrap gap-3 items-center">
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="pl-9 pr-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <button
              onClick={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
            >
              Today
            </button>
            <button
              onClick={() => setSelectedDate('')}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
            >
              All
            </button>
            <div className="relative flex-1 min-w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, phone, order no"
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <button
              onClick={() => navigate('/pos', { state: { orderType: 'reservation' } })}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold"
            >
              New Reservation
            </button>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center text-gray-400">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Loading reservations...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="h-64 bg-white border rounded-xl flex flex-col items-center justify-center text-gray-400">
              <Calendar className="w-10 h-10 mb-2" />
              <p>No reservations for this filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredOrders.map((order) => (
                <div key={order.id} className="bg-white border rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-gray-900">{order.orderNumber || order.id.slice(-4)}</p>
                      <p className="text-sm text-gray-600">{order.customerInfo?.name || 'Guest'}</p>
                      {order.customerInfo?.phone && <p className="text-xs text-gray-500">{order.customerInfo.phone}</p>}
                    </div>
                    <span className="px-2 py-1 rounded-full bg-pink-50 text-pink-700 text-xs font-semibold">Reservation</span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4 text-pink-500" />
                      {order.reservationTime
                        ? new Date(order.reservationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'No time'}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="w-4 h-4 text-pink-500" />
                      {order.pax || '-'} pax
                    </div>
                  </div>

                  <div className="mt-4 text-xs text-gray-500 line-clamp-2">
                    {order.items.map((item) => `${item.quantity}x ${item.name}`).join(', ')}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <select
                      value={selectedTableByOrder[order.id] || ''}
                      onChange={(event) => setSelectedTableByOrder((prev) => ({ ...prev, [order.id]: event.target.value }))}
                      className="flex-1 border rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">Assign table</option>
                      {availableTables.map((table) => (
                        <option key={table.id} value={table.id}>
                          Table {table.number} ({table.capacity} pax)
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => void assignTableAndSend(order)}
                      disabled={!selectedTableByOrder[order.id] || assigningId === order.id}
                      className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                    >
                      {assigningId === order.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
