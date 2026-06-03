import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Bell,
  Package,
  Utensils,
  Settings,
  Receipt,
  LogOut,
  Clock,
  Users,
  Plus,
  QrCode,
  ShoppingBag,
  Car,
  Home,
  Smartphone,
} from 'lucide-react';
import { usePOSStore } from '../stores/posStore';
import type { POSOrder, Table } from '../lib/types';

// ============================================
// HELPERS
// ============================================
const getTables = (): Table[] => {
  try {
    const saved = localStorage.getItem('mat-pos-tables');
    if (saved) return JSON.parse(saved);
  } catch {
    /* corrupt data */
  }
  return [];
};

const getActiveOrders = (): POSOrder[] => {
  try {
    const saved = localStorage.getItem('mat-pos-active-orders');
    if (saved) {
      const orders = JSON.parse(saved);
      return orders.filter((o: POSOrder) => o.status === 'active');
    }
  } catch {
    /* corrupt */
  }
  return [];
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'available':
      return 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100';
    case 'occupied':
      return 'bg-red-50 border-red-200 text-red-800 hover:bg-red-100';
    case 'reserved':
      return 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100';
    default:
      return 'bg-gray-50 border-gray-200 text-gray-800';
  }
};

const getStatusDot = (status: string) => {
  switch (status) {
    case 'available':
      return 'bg-emerald-500';
    case 'occupied':
      return 'bg-red-500';
    case 'reserved':
      return 'bg-amber-500';
    default:
      return 'bg-gray-500';
  }
};

const getOrderTypeIcon = (type: string) => {
  switch (type) {
    case 'dine-in':
      return <Home className="w-4 h-4" />;
    case 'takeaway':
      return <ShoppingBag className="w-4 h-4" />;
    case 'delivery':
      return <Car className="w-4 h-4" />;
    case 'reservation':
      return <Calendar className="w-4 h-4" />;
    default:
      return <Smartphone className="w-4 h-4" />;
  }
};

const getOrderTypeColor = (type: string) => {
  switch (type) {
    case 'dine-in':
      return 'bg-blue-50 border-blue-200 text-blue-800';
    case 'takeaway':
      return 'bg-orange-50 border-orange-200 text-orange-800';
    case 'delivery':
      return 'bg-purple-50 border-purple-200 text-purple-800';
    case 'reservation':
      return 'bg-pink-50 border-pink-200 text-pink-800';
    default:
      return 'bg-gray-50 border-gray-200 text-gray-800';
  }
};

// ============================================
// COMPONENT
// ============================================
export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentStaff, logout } = usePOSStore();
  const [activeOrders, setActiveOrders] = useState<POSOrder[]>([]);
  const [tables, setTables] = useState<Table[]>([]);

  // Load data on mount and refresh
  useEffect(() => {
    const loadData = () => {
      setActiveOrders(getActiveOrders());
      setTables(getTables());
    };
    loadData();

    // Refresh every 3 seconds
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleOrderClick = (order: POSOrder) => {
    navigate('/pos', {
      state: {
        editMode: true,
        orderId: order.id,
        orderItems: order.items,
        orderType: order.type,
        tableNumber: order.tableNumber,
        customerInfo: order.customerInfo,
        createdAt: order.createdAt,
      },
    });
  };

  const handleTableClick = (table: Table) => {
    if (table.status === 'occupied') {
      const order = activeOrders.find((o) => o.tableNumber === table.number);
      if (order) {
        handleOrderClick(order);
      } else {
        navigate('/pos', { state: { tableNumber: table.number, orderType: 'dine-in' } });
      }
    } else if (table.status === 'available') {
      navigate('/pos', { state: { tableNumber: table.number, orderType: 'dine-in' } });
    }
  };

  const handleQROrder = () => {
    // Show QR orders section or navigate to QR order management
    const qrOrders = activeOrders.filter(o => o.isQrOrder);
    if (qrOrders.length === 0) {
      alert('No QR orders pending');
      return;
    }
    // Scroll to QR orders or show modal
    const qrSection = document.getElementById('qr-orders-section');
    qrSection?.scrollIntoView({ behavior: 'smooth' });
  };

  const navItems = [
    { icon: Receipt, label: 'Receipt', path: '/receipts' },
    { icon: Utensils, label: 'Edit Menu', path: '/menu' },
    { icon: Package, label: 'Inventory', path: '/inventory' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  // Filter orders
  const dineInOrders = activeOrders.filter((o) => o.type === 'dine-in');
  const takeawayOrders = activeOrders.filter((o) => o.type === 'takeaway');
  const deliveryOrders = activeOrders.filter((o) => o.type === 'delivery');
  const reservationOrders = activeOrders.filter((o) => o.type === 'reservation');
  const qrOrders = activeOrders.filter((o) => o.isQrOrder);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-sm">MAT</span>
          </div>
          <div>
            <h1 className="font-bold text-gray-900">MAT.ai POS</h1>
            <p className="text-xs text-gray-500">Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            {qrOrders.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {qrOrders.length}
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
            {qrOrders.length > 0 && (
              <div id="qr-orders-section">
                <h3 className="text-xs font-semibold text-primary-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Smartphone className="w-3 h-3" />
                  QR Orders ({qrOrders.length})
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {qrOrders.map((order) => (
                    <button
                      key={order.id}
                      onClick={() => handleOrderClick(order)}
                      className="relative p-4 rounded-xl border-2 border-primary-200 bg-primary-50 
                               hover:bg-primary-100 hover:border-primary-400 transition-all 
                               hover:scale-105 active:scale-95 text-left"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-lg text-primary-700">
                          {order.orderNumber || order.id.slice(-4)}
                        </span>
                        <Smartphone className="w-4 h-4 text-primary-500" />
                      </div>
                      <p className="text-sm font-medium text-gray-700 truncate">
                        {order.customerName || order.customerInfo?.name || 'Guest'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.items.reduce((sum, i) => sum + i.qty, 0)} items
                      </p>
                      <p className="text-sm font-bold text-primary-600 mt-2">
                        RM {order.total.toFixed(2)}
                      </p>
                      {order.tableNumber && (
                        <p className="text-xs text-gray-500 mt-1">
                          🪑 {order.tableNumber}
                        </p>
                      )}
                    </button>
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
                      {table.status === 'occupied' ? 'Occupied' : table.status}
                    </p>
                    {table.status === 'occupied' && (
                      <p className="text-xs opacity-60 mt-1">
                        RM{' '}
                        {dineInOrders
                          .find((o) => o.tableNumber === table.number)
                          ?.total.toFixed(2) || '0.00'}
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
                        {order.customerInfo?.name || order.customerName || 'Guest'}
                      </p>
                      <p className="text-xs opacity-70 mt-1">
                        {order.items.reduce((sum, i) => sum + i.qty, 0)} items
                      </p>
                      <p className="text-sm font-bold mt-2">
                        RM {order.total.toFixed(2)}
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
                        {order.customerInfo?.name || order.customerName || 'Guest'}
                      </p>
                      <p className="text-xs opacity-70 mt-1">
                        {order.items.reduce((sum, i) => sum + i.qty, 0)} items
                      </p>
                      <p className="text-sm font-bold mt-2">
                        RM {order.total.toFixed(2)}
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
                        {order.customerInfo?.name || order.customerName || 'Guest'}
                      </p>
                      {order.reservationTime && (
                        <p className="text-xs text-pink-600 mt-1">
                          ⏰ {new Date(order.reservationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                      <p className="text-xs opacity-70 mt-1">
                        {order.items.reduce((sum, i) => sum + i.qty, 0)} items
                      </p>
                      <p className="text-sm font-bold mt-2">
                        RM {order.total.toFixed(2)}
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
            {qrOrders.length > 0 && (
              <p className="text-xs text-primary-600 mt-1 font-medium">
                {qrOrders.length} QR orders pending
              </p>
            )}
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-4">
            <p className="text-xs text-gray-500 mb-1">Today's Sales</p>
            <p className="text-xl font-bold text-gray-900">
              RM {activeOrders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}
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
                       qrOrders.length > 0
                         ? 'bg-orange-500 text-white hover:bg-orange-600 animate-pulse'
                         : 'bg-gray-200 text-gray-600'
                     }`}
          >
            <QrCode className="w-5 h-5" />
            <div className="flex-1">
              <span className="text-sm font-semibold">QR Orders</span>
              {qrOrders.length > 0 && (
                <span className="ml-2 text-xs bg-white/20 px-1.5 py-0.5 rounded-full">
                  {qrOrders.length}
                </span>
              )}
            </div>
          </button>
        </aside>
      </div>
    </div>
  );
};
