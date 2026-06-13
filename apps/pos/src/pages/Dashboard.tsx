// apps/pos/src/pages/Dashboard.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Bell, Package, Utensils, Settings, Receipt, LogOut,
  Clock, Users, Plus, QrCode, ShoppingBag, Car, Smartphone,
  Check, X, Edit3
} from 'lucide-react';
import { usePOSStore } from '../stores/posStore';
import { useSocket } from '../hooks/useSocket';
import { wsServer } from '../lib/ws';
import type { Order, DiningTable, OrderType } from '@mat-ai/types';
import { normalizeBackendOrder, toFrontendOrderType } from '../lib/types';

const API_URL = import.meta.env.VITE_WS_URL || 'http://localhost:4000';

// Frontend display helpers for order type
const getOrderTypeLabel = (type: OrderType): string => {
  const labels: Record<OrderType, string> = {
    DINE_IN: 'Dine In',
    PICKUP: 'Takeaway',
    DELIVERY: 'Delivery',
    RESERVATION: 'Reservation',
  };
  return labels[type] || type;
};

// Check if order is from QR Menu
const isQrOrder = (order: Order): boolean => order.source === 'QR_MENU';

export function Dashboard() {
  const navigate = useNavigate();
  const { currentStaff, logout } = usePOSStore();
  const { socket, connected } = useSocket('pos');

  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [wsOrders, setWsOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingQrId, setProcessingQrId] = useState<string | null>(null);

  // Fetch data from backend API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, tablesRes] = await Promise.all([
          fetch(`${API_URL}/orders?status=PENDING`),
          fetch(`${API_URL}/tables`),
        ]);

        const ordersData = await ordersRes.json();
        const orders = Array.isArray(ordersData) ? ordersData : [];
        const tablesData = await tablesRes.json();

        setActiveOrders(orders.map(normalizeBackendOrder));
        setTables(tablesData);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Listen for WebSocket events
  useEffect(() => {
    if (!socket) return;

    socket.on('pos:newOrder', (order) => {
      console.log('📱 New QR order:', order);
      setWsOrders(prev => [normalizeBackendOrder(order), ...prev]);
      new Audio('/notification.mp3').play().catch(() => {});
    });

    socket.on('pos:orderReady', (order) => {
      console.log('✅ Order ready:', order);
    });

    socket.on('order:updated', (order) => {
      const normalized = normalizeBackendOrder(order);
      setActiveOrders(prev => prev.map(o => o.id === normalized.id ? { ...o, ...normalized } : o));
      // Also update in wsOrders if present
      setWsOrders(prev => prev.map(o => o.id === normalized.id ? { ...o, ...normalized } : o).filter(o => o.status !== 'CANCELLED'));
    });

    return () => {
      socket.off('pos:newOrder');
      socket.off('pos:orderReady');
      socket.off('order:updated');
    };
  }, [socket]);

  useEffect(() => {
    // Start local WS server for KDS connections
    if (!wsServer.isRunning) {
      wsServer.start();
    }
    
    return () => {
      // Jangan stop — KDS perlu stay connected
      // wsServer.stop(); 
    };
  }, []);

  // Combine API orders + WS orders (deduplicate by id)
  const allOrdersMap = new Map<string, Order>();
  [...activeOrders, ...wsOrders].forEach(o => allOrdersMap.set(o.id, o));
  const allOrders = Array.from(allOrdersMap.values());

  // Filter by OrderType enum
  const dineInOrders = allOrders.filter((o) => o.type === 'DINE_IN');
  const takeawayOrders = allOrders.filter((o) => o.type === 'PICKUP');
  const deliveryOrders = allOrders.filter((o) => o.type === 'DELIVERY');
  const reservationOrders = allOrders.filter((o) => o.type === 'RESERVATION');
  const qrOrdersList = allOrders.filter((o) => isQrOrder(o) && o.status === 'PENDING');

  const handleLogout = () => { logout(); navigate('/'); };

  const handleOrderClick = (order: Order) => {
    navigate('/pos', {
      state: {
        editMode: true,
        order: normalizeBackendOrder(order),
        tableNumber: order.table?.number,
        orderType: toFrontendOrderType(order.type),
      },
    });
  };

  const handleTableClick = (table: DiningTable) => {
    if (table.status === 'OCCUPIED') {
      const order = dineInOrders.find((o) => o.table?.number === table.number);
      if (order) handleOrderClick(order);
      else navigate('/pos', { state: { tableNumber: table.number, orderType: 'dine-in' } });
    } else {
      navigate('/pos', { state: { tableNumber: table.number, orderType: 'dine-in' } });
    }
  };

  const handleQROrder = () => {
    if (qrOrdersList.length === 0) {
      alert('No QR orders pending');
      return;
    }
    document.getElementById('qr-orders-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  // ============================================
  // QR ORDER HANDLERS
  // ============================================

  /** Confirm QR Order → Backend API → WS Broadcast → KDS */
  const handleConfirmQrOrder = async (order: Order) => {
    setProcessingQrId(order.id);
    try {
      // 1. Update order status to PREPARING (confirmed)
      const res = await fetch(`${API_URL}/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PREPARING',
          source: 'POS', // Mark as confirmed by POS
          confirmedBy: currentStaff?.id || 'system',
          confirmedAt: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to confirm order: ${res.status}`);
      }

      const updatedOrder = await res.json();
      const normalized = normalizeBackendOrder(updatedOrder);

      // 2. Broadcast to KDS via LOCAL WebSocket (MATaiWSServer on port 3001)
      // NOT Socket.IO — KDS connects directly to POS WS
      wsServer.broadcastOrder(normalized);

      // 3. Remove from QR pending list
      setWsOrders(prev => prev.filter(o => o.id !== order.id));
      setActiveOrders(prev => prev.map(o => o.id === order.id ? normalized : o));

      // 4. Play success sound
      new Audio('/success.mp3').play().catch(() => {});

    } catch (err) {
      console.error('❌ Failed to confirm QR order:', err);
      alert('Failed to confirm order. Please try again.');
    } finally {
      setProcessingQrId(null);
    }
  };

  /** Edit QR Order → Navigate to POSPage with order data */
  const handleEditQrOrder = (order: Order) => {
    navigate('/pos', {
      state: {
        editMode: true,
        order: normalizeBackendOrder(order),
        tableNumber: order.table?.number,
        orderType: toFrontendOrderType(order.type),
        isQrEdit: true, // Flag to indicate QR order edit
      },
    });
  };

  /** Reject/Cancel QR Order */
  const handleRejectQrOrder = async (order: Order) => {
    if (!confirm(`Are you sure you want to reject order #${order.orderNumber || order.id.slice(-4)}?`)) {
      return;
    }

    setProcessingQrId(order.id);
    try {
      const res = await fetch(`${API_URL}/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'CANCELLED',
          cancelledBy: currentStaff?.id || 'system',
          cancelledAt: new Date().toISOString(),
          cancellationReason: 'Rejected by POS staff',
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to cancel order: ${res.status}`);
      }

      // Remove from lists
      setWsOrders(prev => prev.filter(o => o.id !== order.id));
      setActiveOrders(prev => prev.filter(o => o.id !== order.id));

    } catch (err) {
      console.error('❌ Failed to reject QR order:', err);
      alert('Failed to reject order. Please try again.');
    } finally {
      setProcessingQrId(null);
    }
  };

  // ============================================
  // HELPERS
  // ============================================

  const getStatusColor = (status: DiningTable['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100';
      case 'OCCUPIED':
        return 'bg-red-50 border-red-200 text-red-800 hover:bg-red-100';
      case 'RESERVED':
        return 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100';
      case 'CLEANING':
        return 'bg-gray-50 border-gray-200 text-gray-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getStatusDot = (status: DiningTable['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-500';
      case 'OCCUPIED':
        return 'bg-red-500';
      case 'RESERVED':
        return 'bg-amber-500';
      case 'CLEANING':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const navItems = [
    { icon: Receipt, label: 'Receipt', path: '/receipts' },
    { icon: Utensils, label: 'Edit Menu', path: '/menu' },
    { icon: Package, label: 'Inventory', path: '/inventory' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header with connection status */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-sm">MAT</span>
          </div>
          <div>
            <h1 className="font-bold text-gray-900">MAT.ai POS</h1>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500">Dashboard</p>
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleQROrder}
            className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {qrOrdersList.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                {qrOrdersList.length}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
            <Users className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              {currentStaff?.name || 'Guest'}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 3-Column Layout */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Left Sidebar - Navigation */}
        <aside className="w-44 flex flex-col gap-3 shrink-0">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
            Menu
          </h3>
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border shadow-sm
                       hover:shadow-md hover:bg-gray-50 active:scale-[0.98] transition-all text-left"
            >
              <item.icon className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">{item.label}</span>
            </button>
          ))}
        </aside>

        {/* Center - Active Orders & Tables */}
        <main className="flex-1 bg-white rounded-2xl shadow-sm border p-4 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-600" />
              Active Orders
            </h2>
            <div className="flex gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-gray-600">Available</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-gray-600">Occupied</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-gray-600">Reserved</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto space-y-4">
            {/* QR ORDERS SECTION */}
            {qrOrdersList.length > 0 && (
              <div id="qr-orders-section">
                <h3 className="text-xs font-semibold text-primary-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Smartphone className="w-3 h-3" />
                  QR Orders ({qrOrdersList.length}) — Needs Review
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {qrOrdersList.map((order) => (
                    <div
                      key={order.id}
                      className="relative p-4 rounded-xl border-2 border-primary-200 bg-primary-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-lg text-primary-700">
                              {order.orderNumber || order.id.slice(-4)}
                            </span>
                            <Smartphone className="w-4 h-4 text-primary-500" />
                            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                              {getOrderTypeLabel(order.type)}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-700">
                            {order.customerInfo?.name || 'Guest'}
                            {order.customerInfo?.phone && ` · ${order.customerInfo.phone}`}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {order.items.reduce((sum, i) => sum + i.quantity, 0)} items · 
                            RM {order.totalAmount.toFixed(2)}
                          </p>
                          {order.table?.number && (
                            <p className="text-xs text-gray-500 mt-1">
                              🪑 Table {order.table.number}
                            </p>
                          )}
                          <div className="mt-2 text-xs text-gray-400">
                            {order.items.slice(0, 3).map(item => (
                              <span key={item.id} className="mr-2">
                                {item.quantity}x {item.name}
                              </span>
                            ))}
                            {order.items.length > 3 && <span>+{order.items.length - 3} more</span>}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2 ml-4">
                          <button
                            onClick={() => handleConfirmQrOrder(order)}
                            disabled={processingQrId === order.id}
                            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50"
                          >
                            {processingQrId === order.id ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                            Confirm
                          </button>
                          <button
                            onClick={() => handleEditQrOrder(order)}
                            disabled={processingQrId === order.id}
                            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
                          >
                            <Edit3 className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleRejectQrOrder(order)}
                            disabled={processingQrId === order.id}
                            className="flex items-center gap-1.5 px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 active:scale-95 transition-all disabled:opacity-50"
                          >
                            <X className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TABLES GRID */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Floor Plan
              </h3>
              <div className="grid grid-cols-4 gap-3">
                {tables.map((table) => (
                  <button
                    key={table.id}
                    onClick={() => handleTableClick(table)}
                    className={`relative p-4 rounded-xl border-2 transition-all hover:scale-105 active:scale-95 text-left ${getStatusColor(
                      table.status
                    )}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-lg">{table.number}</span>
                      <div className={`w-3 h-3 rounded-full ${getStatusDot(table.status)}`} />
                    </div>
                    <p className="text-sm font-medium opacity-90">
                      {table.status === 'OCCUPIED' ? 'Occupied' : table.status.toLowerCase()}
                    </p>
                    {table.status === 'OCCUPIED' && (
                      <p className="text-xs opacity-60 mt-1">
                        RM{' '}
                        {dineInOrders
                          .find((o) => o.table?.number === table.number)
                          ?.totalAmount.toFixed(2) || '0.00'}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* TAKEAWAY ORDERS */}
            {takeawayOrders.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Takeaway
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {takeawayOrders.map((order) => (
                    <button
                      key={order.id}
                      onClick={() => handleOrderClick(order)}
                      className="relative p-4 rounded-xl border-2 bg-orange-50 border-orange-200
                               text-orange-800 hover:bg-orange-100 transition-all 
                               hover:scale-105 active:scale-95 text-left"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-lg">TW</span>
                        <ShoppingBag className="w-4 h-4 text-orange-500" />
                      </div>
                      <p className="text-sm font-medium truncate">
                        {order.customerInfo?.name || 'Guest'}
                      </p>
                      <p className="text-xs opacity-70 mt-1">
                        {order.items.reduce((sum, i) => sum + i.quantity, 0)} items
                      </p>
                      <p className="text-sm font-bold mt-2">
                        RM {order.totalAmount.toFixed(2)}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* DELIVERY ORDERS */}
            {deliveryOrders.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Delivery
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {deliveryOrders.map((order) => (
                    <button
                      key={order.id}
                      onClick={() => handleOrderClick(order)}
                      className="relative p-4 rounded-xl border-2 bg-purple-50 border-purple-200
                               text-purple-800 hover:bg-purple-100 transition-all 
                               hover:scale-105 active:scale-95 text-left"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-lg">DL</span>
                        <Car className="w-4 h-4 text-purple-500" />
                      </div>
                      <p className="text-sm font-medium truncate">
                        {order.customerInfo?.name || 'Guest'}
                      </p>
                      <p className="text-xs opacity-70 mt-1">
                        {order.items.reduce((sum, i) => sum + i.quantity, 0)} items
                      </p>
                      <p className="text-sm font-bold mt-2">
                        RM {order.totalAmount.toFixed(2)}
                      </p>
                      {order.customerInfo?.address && (
                        <p className="text-xs opacity-70 mt-1 truncate">
                          📍 {order.customerInfo.address}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* RESERVATION ORDERS */}
            {reservationOrders.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Reservations
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {reservationOrders.map((order) => (
                    <button
                      key={order.id}
                      onClick={() => handleOrderClick(order)}
                      className="relative p-4 rounded-xl border-2 bg-pink-50 border-pink-200
                               text-pink-800 hover:bg-pink-100 transition-all 
                               hover:scale-105 active:scale-95 text-left"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-lg">RS</span>
                        <Calendar className="w-4 h-4 text-pink-500" />
                      </div>
                      <p className="text-sm font-medium truncate">
                        {order.customerInfo?.name || 'Guest'}
                      </p>
                      {order.reservationTime && (
                        <p className="text-xs text-pink-600 mt-1">
                          ⏰ {new Date(order.reservationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                      <p className="text-xs opacity-70 mt-1">
                        {order.items.reduce((sum, i) => sum + i.quantity, 0)} items
                      </p>
                      <p className="text-sm font-bold mt-2">
                        RM {order.totalAmount.toFixed(2)}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar - Stats & Actions */}
        <aside className="w-52 flex flex-col gap-3 shrink-0">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
            Overview
          </h3>

          {/* Stats Cards */}
          <div className="bg-white rounded-xl border shadow-sm p-4">
            <p className="text-xs text-gray-500 mb-1">Active Orders</p>
            <p className="text-xl font-bold text-gray-900">{activeOrders.length}</p>
            <p className="text-xs text-gray-500 mt-1">
              {dineInOrders.length} dine-in · {takeawayOrders.length} takeaway · {deliveryOrders.length} delivery
            </p>
            {qrOrdersList.length > 0 && (
              <p className="text-xs text-primary-600 mt-1 font-medium">
                {qrOrdersList.length} QR orders pending
              </p>
            )}
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-4">
            <p className="text-xs text-gray-500 mb-1">Today\'s Sales</p>
            <p className="text-xl font-bold text-gray-900">
              RM {activeOrders.reduce((sum, o) => sum + o.totalAmount, 0).toFixed(2)}
            </p>
            <p className="text-xs text-emerald-600 mt-1 font-medium">Active only</p>
          </div>

          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mt-1">
            Actions
          </h3>

          {/* Action Buttons */}
          <button
            onClick={() => navigate('/pos')}
            className="flex items-center gap-3 px-4 py-3 bg-primary-600 text-white rounded-xl shadow-md
                     hover:bg-primary-700 active:scale-[0.98] transition-all text-left"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm font-semibold">New Order</span>
          </button>

          <button
            onClick={() => navigate('/pos', { state: { orderType: 'reservation' } })}
            className="flex items-center gap-3 px-4 py-3 bg-purple-600 text-white rounded-xl shadow-md
                     hover:bg-purple-700 active:scale-[0.98] transition-all text-left"
          >
            <Calendar className="w-5 h-5" />
            <span className="text-sm font-semibold">Reservation</span>
          </button>

          <button
            onClick={handleQROrder}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-md
                     active:scale-[0.98] transition-all text-left ${
                       qrOrdersList.length > 0
                         ? 'bg-orange-500 text-white hover:bg-orange-600 animate-pulse'
                         : 'bg-gray-200 text-gray-600'
                     }`}
          >
            <QrCode className="w-5 h-5" />
            <div className="flex-1">
              <span className="text-sm font-semibold">QR Orders</span>
              {qrOrdersList.length > 0 && (
                <span className="ml-2 text-xs bg-white/20 px-1.5 py-0.5 rounded-full">
                  {qrOrdersList.length}
                </span>
              )}
            </div>
          </button>
        </aside>
      </div>
    </div>
  );
}