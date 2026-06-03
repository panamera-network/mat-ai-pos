// apps/pos/src/pages/POSPage.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  X,
  Save,
  Home,
  ShoppingBag,
  Car,
  Check,
  User,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Users,
} from 'lucide-react';
import { wsClient } from '../lib/ws';
import type {
  POSOrder,
  POSOrderItem,
  OrderType,
  CustomerInfo,
} from '../lib/types';
import type { MenuItem, Category, Table } from '@mat-ai/types';

// ============================================
// HELPERS — load from localStorage
// ============================================
const getMenuItems = (): MenuItem[] => {
  try {
    const saved = localStorage.getItem('mat-pos-menu-items');
    if (saved) return JSON.parse(saved);
  } catch { /* corrupt */ }
  return [];
};

const getCategories = (): Category[] => {
  try {
    const saved = localStorage.getItem('mat-pos-categories');
    if (saved) return JSON.parse(saved);
  } catch { /* corrupt */ }
  return [];
};

const getTables = (): Table[] => {
  try {
    const saved = localStorage.getItem('mat-pos-tables');
    if (saved) return JSON.parse(saved);
  } catch { /* corrupt */ }
  return [];
};

const saveOrder = (order: POSOrder) => {
  try {
    const existing = JSON.parse(localStorage.getItem('mat-pos-active-orders') || '[]');
    const filtered = existing.filter((o: POSOrder) => o.id !== order.id);
    filtered.push(order);
    localStorage.setItem('mat-pos-active-orders', JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to save order', e);
  }
};

const updateTableStatus = (tableId: string, status: Table['status']) => {
  try {
    const tables = getTables();
    const updated = tables.map((t) => t.id === tableId ? { ...t, status } : t);
    localStorage.setItem('mat-pos-tables', JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to update table', e);
  }
};

// ============================================
// COMPONENT
// ============================================
export const POSPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isEditMode = location.state?.editMode || false;
  const existingOrder = location.state?.order as POSOrder | undefined;
  const existingTableId = location.state?.tableId as string | undefined;
  const existingOrderType = location.state?.orderType as OrderType | undefined;
  const existingCustomer = location.state?.customerInfo as CustomerInfo | undefined;
  const existingCreatedAt = location.state?.createdAt as string | undefined;

  const [activeCategory, setActiveCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState<POSOrderItem[]>(existingOrder?.items || []);
  const [orderType, setOrderType] = useState<OrderType>(existingOrderType || 'dine-in');
  const [selectedTableId, setSelectedTableId] = useState<string>(existingTableId || '');
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>(
    existingCustomer || { name: '', phone: '' }
  );

  // Reservation fields
  const [reservationTime, setReservationTime] = useState('');
  const [pax, setPax] = useState('');
  const [orderTiming, setOrderTiming] = useState<'now' | 'later'>('now');

  // Modals
  const [showOrderTypeModal, setShowOrderTypeModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [showModifierModal, setShowModifierModal] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);

  // Data from localStorage
  const menuItems = useMemo(() => getMenuItems(), []);
  const categories = useMemo(() => getCategories(), []);
  const tables = useMemo(() => getTables(), []);
  const availableTables = tables.filter((t) => t.status === 'available');
  const selectedTable = tables.find((t) => t.id === selectedTableId);

  // Auto-select first category
  useEffect(() => {
    if (!activeCategory && categories.length > 0) {
      setActiveCategory(categories[0].id);
    }
  }, [activeCategory, categories]);

  // Init WS
  useEffect(() => {
    wsClient.connect();
  }, []);

  // Show order type modal on new order
  useEffect(() => {
    if (!isEditMode && !existingOrderType) {
      setShowOrderTypeModal(true);
    }
  }, [isEditMode, existingOrderType]);

  // Filter items
  const filteredItems = useMemo(() => {
    if (searchQuery) {
      return menuItems.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return activeCategory
      ? menuItems.filter((item) => item.categoryId === activeCategory)
      : menuItems;
  }, [menuItems, activeCategory, searchQuery]);

  // Build cart item from menu item + modifiers
  const buildCartItem = (item: MenuItem, modStrings: string[]): POSOrderItem => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);

    return {
      id,
      menuId: item.id,
      name: item.name,
      price: item.price,
      qty: 1,
      modifiers: modStrings,
    };
  };

  const addToCart = (item: MenuItem, modStrings: string[] = []) => {
    setCartItems((prev) => {
      const existing = prev.find(
        (i) => i.menuId === item.id && JSON.stringify(i.modifiers) === JSON.stringify(modStrings)
      );
      if (existing) {
        return prev.map((i) =>
          i.menuId === item.id && JSON.stringify(i.modifiers) === JSON.stringify(modStrings)
            ? { ...i, qty: i.qty + 1 }
            : i
        );
      }
      return [...prev, buildCartItem(item, modStrings)];
    });
  };

  const handleMenuItemClick = (item: MenuItem) => {
    if (item.modifiers && item.modifiers.length > 0) {
      setSelectedMenuItem(item);
      setSelectedModifiers([]);
      setShowModifierModal(true);
    } else {
      addToCart(item);
    }
  };

  const handleSaveModifier = () => {
    if (selectedMenuItem) {
      addToCart(selectedMenuItem, selectedModifiers);
      setShowModifierModal(false);
      setSelectedMenuItem(null);
      setSelectedModifiers([]);
    }
  };

  const updateQty = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, qty: Math.max(0, item.qty + delta) } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const removeItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  // Build POSOrder from current state
  const buildOrder = (): POSOrder => ({
    id: existingOrder?.id || `ORD-${Date.now()}`,
    orderNumber: existingOrder?.orderNumber,
    items: cartItems,
    type: orderType,
    status: 'active',
    tableNumber: (orderType === 'dine-in' || orderType === 'reservation') ? selectedTable?.number : undefined,
    customerInfo: (orderType === 'takeaway' || orderType === 'delivery') ? customerInfo : undefined,
    customerName: customerInfo.name || undefined,
    customerPhone: customerInfo.phone || undefined,
    address: orderType === 'delivery' ? customerInfo.address : undefined,
    reservationTime: orderType === 'reservation' ? reservationTime : undefined,
    pax: pax ? parseInt(pax) : undefined,
    orderTiming: orderType === 'reservation' ? orderTiming : 'now',
    notes: customerInfo.note || undefined,
    subtotal,
    tax,
    total,
    createdAt: existingCreatedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // SAVE ORDER
  const handleSaveOrder = () => {
    const order = buildOrder();
    saveOrder(order);

    // WS broadcast
    wsClient.broadcastOrder(order, isEditMode ? 'UPDATE_ORDER' : 'NEW_ORDER');

    if ((orderType === 'dine-in' || orderType === 'reservation') && selectedTableId) {
      updateTableStatus(selectedTableId, orderType === 'reservation' ? 'reserved' : 'occupied');
    }
    navigate('/dashboard');
  };

  const handleConfirmOrderType = () => {
    if (orderType === 'dine-in') {
      setShowOrderTypeModal(false);
      setShowTableModal(true);
    } else if (orderType === 'reservation') {
      setShowOrderTypeModal(false);
      setShowReservationModal(true);
    } else {
      setShowOrderTypeModal(false);
      setShowCustomerModal(true);
    }
  };

  const handleFinalizeOrder = () => {
    if ((orderType === 'dine-in' || orderType === 'reservation') && !selectedTableId) {
      alert('Please select a table');
      return;
    }
    if ((orderType === 'takeaway' || orderType === 'delivery') && !customerInfo.name.trim()) {
      alert('Please enter customer name');
      return;
    }
    if (orderType === 'reservation' && !reservationTime) {
      alert('Please select reservation time');
      return;
    }

    const order = buildOrder();
    saveOrder(order);

    // WS broadcast
    wsClient.broadcastOrder(order, 'NEW_ORDER');

    if ((orderType === 'dine-in' || orderType === 'reservation') && selectedTableId) {
      updateTableStatus(selectedTableId, orderType === 'reservation' ? 'reserved' : 'occupied');
    }

    setShowOrderTypeModal(false);
    setShowTableModal(false);
    setShowCustomerModal(false);
    setShowReservationModal(false);
    navigate('/dashboard');
  };

  const toggleModifier = (mod: string) => {
    setSelectedModifiers((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-2 flex items-center justify-between shadow-sm">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </button>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search all menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-gray-100 rounded-lg text-sm w-56 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Menu */}
        <div className="flex-1 flex flex-col">
          {!searchQuery && categories.length > 0 && (
            <div className="flex gap-2 p-3 overflow-x-auto bg-white border-b">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    activeCategory === cat.id
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat.icon && <span className="mr-1">{cat.icon}</span>}
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-auto p-4">
            {menuItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <ShoppingBag className="w-12 h-12 mb-2" />
                <p className="text-sm">No menu items configured</p>
                <p className="text-xs">Go to Edit Menu to add items</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {filteredItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleMenuItemClick(item)}
                    disabled={item.isAvailable === false}
                    className={`bg-white rounded-xl border-2 p-4 flex flex-col items-center transition-all ${
                      item.isAvailable === false
                        ? 'opacity-50 cursor-not-allowed border-gray-200'
                        : 'border-gray-200 hover:border-primary-400 hover:shadow-md active:scale-95'
                    }`}
                  >
                    <div className="text-5xl mb-3">{item.image || '🍽️'}</div>
                    <p className="text-sm font-medium text-gray-900 text-center leading-tight">{item.name}</p>
                    <p className="text-lg font-bold text-primary-600 mt-2">RM{item.price.toFixed(2)}</p>
                    {item.isAvailable === false && (
                      <span className="text-xs text-red-500 font-bold mt-1">SOLD OUT</span>
                    )}
                    {item.modifiers && item.modifiers.length > 0 && item.isAvailable !== false && (
                      <span className="text-xs text-gray-400 mt-1">+ options</span>
                    )}
                  </button>
                ))}
              </div>
            )}
            {filteredItems.length === 0 && menuItems.length > 0 && (
              <div className="text-center py-12 text-gray-400"><p>No items found</p></div>
            )}
          </div>
        </div>

        {/* Right: Order Cart */}
        <div className="w-[360px] bg-white border-l flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-bold text-gray-900">{isEditMode ? 'Edit Order' : 'New Order'}</h2>
            {isEditMode && selectedTable && <p className="text-sm text-gray-500 mt-1">Table: {selectedTable.number}</p>}
            {isEditMode && customerInfo.name && <p className="text-sm text-gray-500 mt-1">Customer: {customerInfo.name}</p>}
          </div>

          <div className="flex-1 overflow-auto p-4">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <ShoppingBag className="w-12 h-12 mb-2" />
                <p className="text-sm">No items yet</p>
                <p className="text-xs">Tap menu to add</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                        {item.modifiers && item.modifiers.length > 0 && (
                          <p className="text-xs text-gray-500">{item.modifiers.join(', ')}</p>
                        )}
                        <p className="text-xs text-gray-500">RM{item.price.toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 bg-white border rounded-lg flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-bold w-6 text-center">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 bg-white border rounded-lg flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all">
                          <Plus className="w-3 h-3" />
                        </button>
                        <button onClick={() => removeItem(item.id)} className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center hover:bg-red-100 ml-1 transition-colors">
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t bg-gray-50">
            <div className="space-y-1.5 text-sm mb-4">
              <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span className="font-medium">RM{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">SST (8%)</span><span className="font-medium">RM{tax.toFixed(2)}</span></div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200"><span>Total</span><span className="text-primary-600">RM{total.toFixed(2)}</span></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleSaveOrder} disabled={cartItems.length === 0} className="py-3 bg-gray-200 text-gray-800 rounded-xl font-semibold hover:bg-gray-300 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                <Save className="w-5 h-5" /> Save
              </button>
              <button
                onClick={() => navigate(`/payment/${existingOrder?.id || 'new'}`, { state: { order: buildOrder() } })}
                disabled={cartItems.length === 0}
                className="py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 active:bg-primary-800 active:scale-95 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Pay <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Order Type Modal */}
      {showOrderTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 p-8">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Select Order Type</h2>
            <p className="text-center text-gray-500 mb-8">How will this order be served?</p>
            <div className="space-y-4">
              {([
                { type: 'dine-in' as OrderType, label: 'Dine In', desc: 'Customer eats at table', icon: Home, color: 'blue' },
                { type: 'takeaway' as OrderType, label: 'Takeaway', desc: 'Customer picks up order', icon: ShoppingBag, color: 'orange' },
                { type: 'delivery' as OrderType, label: 'Delivery', desc: 'Order delivered to address', icon: Car, color: 'purple' },
                { type: 'reservation' as OrderType, label: 'Reservation', desc: 'Book table for later', icon: Calendar, color: 'pink' },
              ]).map(({ type, label, desc, icon: Icon, color }) => (
                <button key={type} onClick={() => setOrderType(type)} className={`w-full p-5 rounded-2xl border-2 transition-all flex items-center gap-4 group ${orderType === type ? `border-${color}-500 bg-${color}-50` : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className={`w-14 h-14 bg-${color}-100 rounded-2xl flex items-center justify-center group-hover:bg-${color}-200 transition-colors`}>
                    <Icon className={`w-7 h-7 text-${color}-600`} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-gray-900 text-lg">{label}</h3>
                    <p className="text-sm text-gray-500">{desc}</p>
                  </div>
                  {orderType === type && <Check className={`w-6 h-6 text-${color}-600 ml-auto`} />}
                </button>
              ))}
            </div>
            <button onClick={handleConfirmOrderType} className="w-full mt-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 active:scale-95 transition-all">Continue</button>
          </div>
        </div>
      )}

      {/* Table Selection Modal */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Select Table</h2>
                <p className="text-sm text-gray-500">{availableTables.length} tables available</p>
              </div>
              <button onClick={() => setShowTableModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-4 gap-3 max-h-[400px] overflow-auto">
              {tables.map((table) => (
                <button
                  key={table.id}
                  onClick={() => table.status === 'available' && setSelectedTableId(table.id)}
                  disabled={table.status !== 'available'}
                  className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${
                    table.status === 'available'
                      ? selectedTableId === table.id
                        ? 'border-emerald-500 bg-emerald-100 ring-2 ring-emerald-500 ring-offset-2'
                        : 'border-emerald-200 bg-emerald-50 hover:border-emerald-500 hover:bg-emerald-100 active:scale-95'
                      : 'opacity-50 cursor-not-allowed ' + (table.status === 'occupied' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50')
                  }`}
                >
                  <span className="text-lg font-bold text-gray-900">{table.number}</span>
                  <span className={`text-xs font-medium ${table.status === 'available' ? 'text-emerald-600' : table.status === 'occupied' ? 'text-red-600' : 'text-amber-600'}`}>{table.status}</span>
                </button>
              ))}
            </div>
            <button onClick={handleFinalizeOrder} disabled={!selectedTableId} className="w-full mt-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              <Check className="w-5 h-5" /> Confirm & Save
            </button>
          </div>
        </div>
      )}

      {/* Reservation Modal */}
      {showReservationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Reservation</h2>
            <p className="text-sm text-gray-500 mb-6">Book a table for your customer</p>
            <div className="space-y-4">
              {/* Table Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Table</label>
                <div className="grid grid-cols-4 gap-2">
                  {tables.filter(t => t.status === 'available').map((table) => (
                    <button
                      key={table.id}
                      onClick={() => setSelectedTableId(table.id)}
                      className={`p-2 rounded-xl border-2 text-sm font-medium transition-all ${
                        selectedTableId === table.id
                          ? 'border-pink-500 bg-pink-100'
                          : 'border-gray-200 hover:border-pink-300'
                      }`}
                    >
                      {table.number}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={customerInfo.name} onChange={(e) => setCustomerInfo(p => ({ ...p, name: e.target.value }))} placeholder="Enter name" className="w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="tel" value={customerInfo.phone} onChange={(e) => setCustomerInfo(p => ({ ...p, phone: e.target.value }))} placeholder="Enter phone" className="w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
                </div>
              </div>

              {/* Pax */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Pax *</label>
                <div className="relative">
                  <Users className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="number" min="1" value={pax} onChange={(e) => setPax(e.target.value)} placeholder="How many people?" className="w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
                </div>
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reservation Time *</label>
                <div className="relative">
                  <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="datetime-local" value={reservationTime} onChange={(e) => setReservationTime(e.target.value)} className="w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
                </div>
              </div>

              {/* Order Timing */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Order Timing</label>
                <div className="flex gap-2">
                  <button onClick={() => setOrderTiming('now')} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${orderTiming === 'now' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                    Order Now
                  </button>
                  <button onClick={() => setOrderTiming('later')} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${orderTiming === 'later' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                    @ Counter
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea value={customerInfo.note || ''} onChange={(e) => setCustomerInfo(p => ({ ...p, note: e.target.value }))} placeholder="Any special requests..." rows={2} className="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none" />
              </div>
            </div>
            <button onClick={handleFinalizeOrder} className="w-full mt-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 active:scale-95 transition-all flex items-center justify-center gap-2">
              <Check className="w-5 h-5" /> Confirm Reservation
            </button>
          </div>
        </div>
      )}

      {/* Customer Info Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">{orderType === 'takeaway' ? 'Takeaway Details' : 'Delivery Details'}</h2>
            <p className="text-sm text-gray-500 mb-6">Enter customer information</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={customerInfo.name} onChange={(e) => setCustomerInfo(p => ({ ...p, name: e.target.value }))} placeholder="Enter name" className="w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="tel" value={customerInfo.phone} onChange={(e) => setCustomerInfo(p => ({ ...p, phone: e.target.value }))} placeholder="Enter phone number" className="w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
                </div>
              </div>
              {orderType === 'delivery' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address *</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <textarea value={customerInfo.address || ''} onChange={(e) => setCustomerInfo(p => ({ ...p, address: e.target.value }))} placeholder="Enter delivery address" rows={3} className="w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none" />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
                <textarea value={customerInfo.note || ''} onChange={(e) => setCustomerInfo(p => ({ ...p, note: e.target.value }))} placeholder="Any special instructions..." rows={2} className="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none" />
              </div>
            </div>
            <button onClick={handleFinalizeOrder} className="w-full mt-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 active:scale-95 transition-all flex items-center justify-center gap-2">
              <Check className="w-5 h-5" /> Confirm & Save
            </button>
          </div>
        </div>
      )}

      {/* Modifier Modal */}
      {showModifierModal && selectedMenuItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModifierModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">{selectedMenuItem.image || '🍽️'}</div>
              <h2 className="text-xl font-bold text-gray-900">{selectedMenuItem.name}</h2>
              <p className="text-lg font-bold text-primary-600">RM{selectedMenuItem.price.toFixed(2)}</p>
            </div>
            <div className="space-y-3 mb-6">
              <p className="text-sm font-medium text-gray-700">Select Options:</p>
              {selectedMenuItem.modifiers?.map((mod) => (
                <label key={mod} onClick={() => toggleModifier(mod)} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedModifiers.includes(mod) ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${selectedModifiers.includes(mod) ? 'bg-primary-600 border-primary-600' : 'border-gray-300'}`}>
                    {selectedModifiers.includes(mod) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{mod}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowModifierModal(false)} className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-xl font-medium hover:bg-gray-300 transition-colors">Cancel</button>
              <button onClick={handleSaveModifier} className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 active:scale-95 transition-all flex items-center justify-center gap-2">
                <Plus className="w-5 h-5" /> Add to Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
