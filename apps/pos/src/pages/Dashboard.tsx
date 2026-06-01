// apps/pos/src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
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
} from 'lucide-react';
import { usePOSStore } from '../stores/posStore';

// ============================================
// TYPES
// ============================================
interface OrderItem {
  id: string;
  menuId: string;
  name: string;
  price: number;
  qty: number;
  modifiers?: string[];
}

interface CustomerInfo {
  name: string;
  phone: string;
  address?: string;
  note?: string;
}

type OrderType = 'dine-in' | 'takeaway' | 'delivery';

interface Order {
  id: string;
  items: OrderItem[];
  type: OrderType;
  status: 'active' | 'completed' | 'cancelled';
  tableNumber?: string;
  customerInfo?: CustomerInfo;
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// HELPERS
// ============================================
const getTables = () => {
  try {
    const saved = localStorage.getItem('mat-pos-tables');
    if (saved) return JSON.parse(saved);
  } catch {
    // corrupt data
  }
  return Array.from({ length: 20 }, (_, i) => ({
    id: (i + 1).toString(),
    number: `T${String(i + 1).padStart(2, '0')}`,
    status: i < 5 ? 'occupied' : i < 7 ? 'reserved' : 'available',
  }));
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

// ============================================
// COMPONENT
// ============================================
export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentStaff, logout } = usePOSStore();
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<any[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const orders = JSON.parse(localStorage.getItem('mat-pos-active-orders') || '[]');
    const tablesData = getTables();
    setActiveOrders(orders.filter((o: Order) => o.status === 'active'));
    setTables(tablesData);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Navigate to edit an existing order
  const handleOrderClick = (order: Order) => {
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

  // Navigate to POS for a table (new or existing order)
  const handleTableClick = (table: any) => {
    if (table.status === 'occupied') {
      // Find the active order for this table
      const order = activeOrders.find((o) => o.tableNumber === table.number);
      if (order) {
        handleOrderClick(order);
      } else {
        // No order found, start new order for this table
        navigate('/pos', { state: { tableNumber: table.number, orderType: 'dine-in' } });
      }
    } else if (table.status === 'available') {
      navigate('/pos', { state: { tableNumber: table.number, orderType: 'dine-in' } });
    }
  };

  const navItems = [
    { icon: Receipt, label: 'Receipt', path: '/receipts' },
    { icon: Utensils, label: 'Edit Menu', path: '/menu' },
    { icon: Package, label: 'Inventory', path: '/inventory' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  // Filter orders by type
  const dineInOrders = activeOrders.filter((o) => o.type === 'dine-in');
  const otherOrders = activeOrders.filter((o) => o.type !== 'dine-in');

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
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {otherOrders.length}
            </span>
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
            <Users className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">{currentStaff?.name || 'Guest'}</span>
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
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">Menu</h3>
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
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-gray-600">Takeaway</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span className="text-gray-600">Delivery</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto space-y-4">
            {/* TABLES GRID */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Floor Plan</h3>
              <div className="grid grid-cols-4 gap-3">
                {tables.map((table) => (
                  <button
                    key={table.id}
                    onClick={() => handleTableClick(table)}
                    className={`relative p-4 rounded-xl border-2 transition-all hover:scale-105 active:scale-95 text-left ${getStatusColor(table.status)}`}
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
                        RM {dineInOrders.find(o => o.tableNumber === table.number)?.total.toFixed(2) || '0.00'}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* TAKEAWAY & DELIVERY ORDERS */}
            {otherOrders.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Takeaway & Delivery
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {otherOrders.map((order) => (
                    <button
                      key={order.id}
                      onClick={() => handleOrderClick(order)}
                      className={`relative p-4 rounded-xl border-2 transition-all hover:scale-105 active:scale-95 text-left ${
                        order.type === 'takeaway'
                          ? 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100'
                          : 'bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-lg">
                          {order.type === 'takeaway' ? 'TW' : 'DL'}
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/60 uppercase">
                          {order.type}
                        </span>
                      </div>
                      <p className="text-sm font-medium truncate">
                        {order.customerInfo?.name || 'Guest'}
                      </p>
                      <p className="text-xs opacity-70 mt-1">
                        {order.items.reduce((sum, i) => sum + i.qty, 0)} items
                      </p>
                      <p className="text-sm font-bold mt-2">
                        RM {order.total.toFixed(2)}
                      </p>
                      <p className="text-xs opacity-60 mt-1">
                        #{order.id.slice(-6)}
                      </p>
                      {order.type === 'delivery' && order.customerInfo?.address && (
                        <p className="text-xs opacity-70 mt-1 truncate">
                          📍 {order.customerInfo.address}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar - Stats & Actions */}
        <aside className="w-52 flex flex-col gap-3 shrink-0">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">Overview</h3>
          
          {/* Stats Cards */}
          <div className="bg-white rounded-xl border shadow-sm p-4">
            <p className="text-xs text-gray-500 mb-1">Active Orders</p>
            <p className="text-xl font-bold text-gray-900">{activeOrders.length}</p>
            <p className="text-xs text-gray-500 mt-1">
              {dineInOrders.length} dine-in · {otherOrders.length} others
            </p>
          </div>
          
          <div className="bg-white rounded-xl border shadow-sm p-4">
            <p className="text-xs text-gray-500 mb-1">Today's Sales</p>
            <p className="text-xl font-bold text-gray-900">
              RM {activeOrders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}
            </p>
            <p className="text-xs text-emerald-600 mt-1 font-medium">Active only</p>
          </div>

          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mt-1">Actions</h3>
          
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
            className="flex items-center gap-3 px-4 py-3 bg-purple-600 text-white rounded-xl shadow-md
                     hover:bg-purple-700 active:scale-[0.98] transition-all text-left"
          >
            <Calendar className="w-5 h-5" />
            <span className="text-sm font-semibold">Booking</span>
          </button>
          
          <button
            className="flex items-center gap-3 px-4 py-3 bg-orange-500 text-white rounded-xl shadow-md
                     hover:bg-orange-600 active:scale-[0.98] transition-all text-left"
          >
            <QrCode className="w-5 h-5" />
            <span className="text-sm font-semibold">QR Order</span>
          </button>
        </aside>
      </div>
    </div>
  );
};