// apps/pos/src/pages/POSPage.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Search, Plus, Minus, Trash2, ArrowRight, X, Save,
  Home, ShoppingBag, Car, Check, User, Phone, MapPin, Calendar,
  Clock, Users, MoreVertical,
} from 'lucide-react';
import type { Order, OrderItem, MenuItem, Category, DiningTable, CustomerInfo, MenuItemOptions,  } from '@mat-ai/types';
import { toBackendOrderType, buildOrderPayload, normalizeBackendOrder } from '../lib/types';
import { wsServer } from '../lib/ws';
import { printBill } from '../lib/print';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:4000';

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

const getTables = (): DiningTable[] => {
  try {
    const saved = localStorage.getItem('mat-pos-tables');
    if (saved) return JSON.parse(saved);
  } catch { /* corrupt */ }
  return [];
};

const saveOrder = (order: Order) => {
  try {
    const existing = JSON.parse(localStorage.getItem('mat-pos-active-orders') || '[]');
    const filtered = existing.filter((o: Order) => o.id !== order.id);
    filtered.push(order);
    localStorage.setItem('mat-pos-active-orders', JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to save order', e);
  }
};

const updateTableStatus = (tableId: string, status: DiningTable['status']) => {
  try {
    const tables = getTables();
    const updated = tables.map((t) => t.id === tableId ? { ...t, status } : t);
    localStorage.setItem('mat-pos-tables', JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to update table', e);
  }
};

// Frontend kebab-case type for UI
export type OrderTypeString = 'dine-in' | 'takeaway' | 'delivery' | 'reservation';

const orderTypeStyles: Record<OrderTypeString, { border: string; bg: string; iconBg: string; iconText: string }> = {
  'dine-in': { border: 'border-blue-500', bg: 'bg-blue-50', iconBg: 'bg-blue-100', iconText: 'text-blue-600' },
  'takeaway': { border: 'border-orange-500', bg: 'bg-orange-50', iconBg: 'bg-orange-100', iconText: 'text-orange-600' },
  'delivery': { border: 'border-purple-500', bg: 'bg-purple-50', iconBg: 'bg-purple-100', iconText: 'text-purple-600' },
  'reservation': { border: 'border-pink-500', bg: 'bg-pink-50', iconBg: 'bg-pink-100', iconText: 'text-pink-600' },
};

const getOptionLabels = (options: unknown): string[] => {
  if (!options) return [];
  if (Array.isArray(options)) {
    return options.flatMap((option: any) => {
      if (typeof option === 'string') return [option];
      if (Array.isArray(option?.choices)) {
        return option.choices.map((choice: any) => `${option.name}: ${choice.name || choice.id || choice}`);
      }
      return [option?.name || option?.label || option?.id].filter(Boolean);
    });
  }
  if (typeof options === 'object') return Object.keys(options as Record<string, unknown>);
  return [];
};

// ============================================
// COMPONENT
// ============================================
export const POSPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as any;

  const isEditMode = state.editMode || false;

  // Support both nested order object AND flat fields from Dashboard
  const incomingOrder = state.order as Order | undefined;

  const existingOrder: Order | undefined = incomingOrder ? {
    ...incomingOrder,
    type: incomingOrder.type || 'DINE_IN',
    status: (incomingOrder.status || 'PENDING') as Order['status'],
    items: (incomingOrder.items || []).map((i: any) => ({
      id: i.id || i.menuItemId || crypto.randomUUID?.() || Math.random().toString(36).slice(2),
      orderId: incomingOrder.id,
      menuItemId: i.menuItemId || i.menuId || i.id || '',
      menuItem: i.menuItem,
      name: i.name || 'Unknown',
      unitPrice: Number(i.unitPrice) || Number(i.price) || 0,
      quantity: Number(i.quantity) || Number(i.qty) || 0,
      totalPrice: (Number(i.unitPrice) || Number(i.price) || 0) * (Number(i.quantity) || Number(i.qty) || 0),
      options: i.options || i.modifiers || [],
      notes: i.notes,
      status: (i.status || 'PENDING') as OrderItem['status'],
      createdAt: i.createdAt || new Date().toISOString(),
      updatedAt: i.updatedAt || new Date().toISOString(),
    })),
  } : undefined;

  const existingTableId = (state.tableId || existingOrder?.tableId) as string | undefined;
  const existingTableNumber = state.tableNumber as string | undefined;
  const existingOrderType = state.orderType as OrderTypeString | undefined;
  const existingCustomer = state.customerInfo as CustomerInfo | undefined;

  const [activeCategory, setActiveCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState<OrderItem[]>(existingOrder?.items || []);
  const [orderType, setOrderType] = useState<OrderTypeString>(existingOrderType || 'dine-in');
  const [selectedTableId, setSelectedTableId] = useState<string>(existingTableId || '');
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>(
    existingCustomer || existingOrder?.customerInfo || { name: '', phone: '' }
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
  const [showOrderActions, setShowOrderActions] = useState(false);
  const [showChangeTypeModal, setShowChangeTypeModal] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);

  const availableTables = tables.filter((t) => t.status === 'AVAILABLE');
  const selectedTable = tables.find((t) => t.id === selectedTableId);

  // Resolve tableNumber to tableId when editing an existing order
  useEffect(() => {
    const tableNumber = existingOrder?.table?.number || existingTableNumber;
    if (tableNumber && tables.length > 0 && !selectedTableId && !existingTableId) {
      const found = tables.find(t => t.number === tableNumber);
      if (found) setSelectedTableId(found.id);
    }
  }, [existingOrder?.table?.number, existingTableNumber, tables, selectedTableId, existingTableId]);

  // Fetch menu & tables from backend
  useEffect(() => {
    const fetchData = async () => {
      let menuData: any[] = [];
      let tablesData: any[] = [];

      // Fetch menu — independent
      try {
        const menuRes = await fetch(`${API_URL}/menu-items`);
        if (menuRes.ok) {
          menuData = await menuRes.json();
        } else {
          console.error('❌ Menu fetch failed:', menuRes.status);
        }
      } catch (err) {
        console.error('❌ Menu fetch error:', err);
      }

      // Fetch tables — independent
      try {
        const tablesRes = await fetch(`${API_URL}/tables`);
        if (tablesRes.ok) {
          tablesData = await tablesRes.json();
        } else {
          console.error('❌ Tables fetch failed:', tablesRes.status);
        }
      } catch (err) {
        console.error('❌ Tables fetch error:', err);
      }

      // Transform menu
      if (menuData.length > 0) {
        const transformedMenu: MenuItem[] = menuData.map((item: any) => ({
          id: item.id,
          name: item.name,
          price: Number(item.price) || 0,
          categoryId: item.categoryId || item.category?.id || 'uncategorized',
          imageUrl: item.imageUrl,
          isAvailable: item.isAvailable ?? true,
          stock: item.stock || 999,
          minStock: item.minStock || 0,
          options: item.options || [],
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: item.updatedAt || new Date().toISOString(),
        }));

        const uniqueCategories: Category[] = [...new Map(
          menuData.map((i: any) => {
            const cat = i.category || { id: 'uncategorized', name: 'Uncategorized' };
            return [cat.id, cat];
          })
        ).values()].map((cat: any, idx: number) => ({
          id: cat.id,
          name: cat.name,
          icon: cat.icon || '🍽️',
          sortOrder: cat.sortOrder ?? idx,
          isActive: cat.isActive ?? true,
          createdAt: cat.createdAt || new Date().toISOString(),
          updatedAt: cat.updatedAt || new Date().toISOString(),
        }));

        setMenuItems(transformedMenu);
        setCategories(uniqueCategories);
        localStorage.setItem('mat-pos-menu-items', JSON.stringify(transformedMenu));
        localStorage.setItem('mat-pos-categories', JSON.stringify(uniqueCategories));
      } else {
        setMenuItems(getMenuItems());
        setCategories(getCategories());
      }

      // Set tables
      if (tablesData.length > 0) {
        setTables(tablesData);
        localStorage.setItem('mat-pos-tables', JSON.stringify(tablesData));
      } else {
        setTables(getTables());
      }

      setMenuLoading(false);
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!activeCategory && categories.length > 0) {
      setActiveCategory(categories[0].id);
    }
  }, [activeCategory, categories]);

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
  const buildCartItem = (item: MenuItem, modStrings: string[] = []): OrderItem => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);

    const unitPrice = Number(item.price) || 0;
    const quantity = 1;

    return {
      id,
      orderId: existingOrder?.id || 'temp',
      menuItemId: item.id,
      menuItem: item,
      name: item.name,
      unitPrice,
      quantity,
      totalPrice: unitPrice * quantity,
      options: modStrings.length > 0
        ? modStrings.map(m => ({ 
            id: m, 
            name: m, 
            required: false,
            multiSelect: false,
            choices: [{ id: m, name: m, priceModifier: 0, isDefault: true }] 
          })) as MenuItemOptions
        : undefined,
      notes: undefined,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const addToCart = (item: MenuItem, modStrings: string[] = []) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.id && JSON.stringify(getOptionLabels(i.options)) === JSON.stringify(modStrings));
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item.id && JSON.stringify(getOptionLabels(i.options)) === JSON.stringify(modStrings)
            ? { ...i, quantity: i.quantity + 1, totalPrice: i.unitPrice * (i.quantity + 1) }
            : i
        );
      }
      return [...prev, buildCartItem(item, modStrings)];
    });
  };

  const handleMenuItemClick = (item: MenuItem) => {
    const itemModifiers = getOptionLabels((item as any).modifiers || (item as any).options);
    if (itemModifiers.length > 0) {
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

  const handleReprintOrderToKds = () => {
    if (!existingOrder) return;
    wsServer.broadcastOrder(buildOrder());
    setShowOrderActions(false);
  };

  const handleVoidTicket = async () => {
    if (!existingOrder?.id) return;
    if (!confirm(`Void order #${existingOrder.orderNumber || existingOrder.id.slice(-4)}?`)) return;
    try {
      const res = await fetch(`${API_URL}/orders/${existingOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to void ticket:', err);
      alert('Failed to void ticket.');
    } finally {
      setShowOrderActions(false);
    }
  };

  const openChangeOrderType = () => {
    setShowOrderActions(false);
    setShowChangeTypeModal(true);
  };

  const openChangeTable = () => {
    setOrderType('dine-in');
    setShowOrderActions(false);
    setShowTableModal(true);
  };

  const applyChangedOrderType = (nextType: OrderTypeString) => {
    setOrderType(nextType);
    setShowChangeTypeModal(false);

    if (nextType === 'dine-in') {
      setShowTableModal(true);
      return;
    }

    if (nextType === 'reservation') {
      setSelectedTableId('');
      setShowReservationModal(true);
      return;
    }

    setSelectedTableId('');
    setShowCustomerModal(true);
  };

  const updateQty = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => (item.id === id ? { 
          ...item, 
          quantity: Math.max(0, item.quantity + delta),
          totalPrice: item.unitPrice * Math.max(0, item.quantity + delta)
        } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  // Build Order from current state
  const buildOrder = (): Order => ({
    id: existingOrder?.id || `ORD-${Date.now()}`,
    orderNumber: existingOrder?.orderNumber || `ORD-${Date.now()}`,
    status: 'PENDING',
    source: existingOrder?.source || 'POS',
    type: toBackendOrderType(orderType),
    totalAmount: total,
    taxAmount: tax,
    customerInfo: (orderType === 'takeaway' || orderType === 'delivery' || orderType === 'reservation') ? customerInfo : undefined,
    tableId: orderType === 'dine-in' ? selectedTableId : undefined,
    table: orderType === 'dine-in' ? selectedTable : undefined,
    pax: pax ? parseInt(pax) : undefined,
    reservationTime: orderType === 'reservation' ? reservationTime : undefined,
    notes: orderType === 'reservation' ? [customerInfo.note, `Reservation timing: ${orderTiming === 'now' ? 'order-now' : 'counter'}`].filter(Boolean).join('\n') : customerInfo.note,
    items: cartItems,
    createdAt: existingOrder?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // ============================================
  // MODAL FLOW HANDLERS
  // ============================================

  const handleConfirmOrderType = () => {
    setShowOrderTypeModal(false);
    if (orderType === 'dine-in') {
      setShowTableModal(true);
    } else if (orderType === 'reservation') {
      setShowReservationModal(true);
    } else if (orderType === 'takeaway' || orderType === 'delivery') {
      setShowCustomerModal(true);
    }
  };

  const handleFinalizeOrder = () => {
    if (orderType === 'dine-in') {
      if (!selectedTableId) return;
      setShowTableModal(false);
    } else if (orderType === 'reservation') {
      if (!customerInfo.name.trim() || !customerInfo.phone.trim() || !pax || !reservationTime) {
        return;
      }
      setShowReservationModal(false);
    } else if (orderType === 'takeaway' || orderType === 'delivery') {
      if (!customerInfo.name.trim() || !customerInfo.phone.trim()) return;
      if (orderType === 'delivery' && !customerInfo.address?.trim()) return;
      setShowCustomerModal(false);
    }
  };

  // SAVE ORDER — FIXED VERSION
  const handleSaveOrder = async (andNavigateToPayment = false) => {
    const order = buildOrder();
    let savedOrderId = order.id;

    try {
      const payload = buildOrderPayload(order, selectedTableId, orderType);
      const endpoint = existingOrder?.id ? `${API_URL}/orders/${existingOrder.id}` : `${API_URL}/orders`;
      const method = existingOrder?.id ? 'PATCH' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to save order: ${res.status} - ${errorText}`);
      }

      const result = await res.json();
      const normalizedOrder = normalizeBackendOrder(result);
      savedOrderId = normalizedOrder.id;
      if (normalizedOrder.type !== 'RESERVATION') {
        if (!wsServer.isRunning) wsServer.start();
        wsServer.broadcastOrder(normalizedOrder);
      }

      if (existingOrder?.tableId && existingOrder.tableId !== selectedTableId) {
        await fetch(`${API_URL}/tables/${existingOrder.tableId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'AVAILABLE' }),
        }).catch(err => console.error('Failed to release previous table:', err));
        updateTableStatus(existingOrder.tableId, 'AVAILABLE');
      }

      // Sync table status to backend
      if (selectedTableId && orderType === 'dine-in') {
        await fetch(`${API_URL}/tables/${selectedTableId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'OCCUPIED',
          }),
        }).catch(err => console.error('Failed to update backend table status:', err));
      }

    } catch (err) {
      console.error('❌ POST /orders failed:', err);
      saveOrder({ ...order, id: savedOrderId });

      if (!andNavigateToPayment) {
        alert('Failed to sync with server. Order saved locally.');
        navigate('/dashboard');
        return;
      }
      alert('Warning: Backend sync failed. Proceeding with local order.');
    }

    // Update local table status
    if (selectedTableId && orderType === 'dine-in') {
      updateTableStatus(selectedTableId, 'OCCUPIED');
    }

    if (andNavigateToPayment) {
      navigate(`/payment/${savedOrderId}`, { 
        state: { order: { ...order, id: savedOrderId } }
      });
    } else {
      navigate('/dashboard');
    }
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
                  {cat.icon && typeof cat.icon === 'string' && (
                    <span className="mr-1">{cat.icon}</span>
                  )}
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-auto p-4">
            {menuLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mb-3" />
                <p className="text-sm">Loading menu...</p>
              </div>
            ) : menuItems.length === 0 ? (
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
                    <div className="text-5xl mb-3">
                      {item.imageUrl ? '📷' : '🍽️'}
                    </div>
                    <p className="text-sm font-medium text-gray-900 text-center leading-tight">{item.name}</p>
                    <p className="text-lg font-bold text-primary-600 mt-2">RM{(Number(item.price) || 0).toFixed(2)}</p>
                    {item.isAvailable === false && (
                      <span className="text-xs text-red-500 font-bold mt-1">SOLD OUT</span>
                    )}
                    {item.options && item.options.length > 0 && item.isAvailable !== false && (
                      <span className="text-xs text-gray-400 mt-1">+ options</span>
                    )}
                  </button>
                ))}
              </div>
            )}
            {!menuLoading && filteredItems.length === 0 && menuItems.length > 0 && (
              <div className="text-center py-12 text-gray-400"><p>No items found</p></div>
            )}
          </div>
        </div>

        {/* Right: Order Cart */}
        <div className="w-[360px] bg-white border-l flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-bold text-gray-900">{isEditMode ? 'Edit Order' : 'New Order'}</h2>
                {isEditMode && selectedTable && <p className="text-sm text-gray-500 mt-1">Table: {selectedTable.number}</p>}
                {isEditMode && customerInfo.name && <p className="text-sm text-gray-500 mt-1">Customer: {customerInfo.name}</p>}
                {isEditMode && orderType === 'delivery' && customerInfo.address && (
                  <p className="text-xs text-gray-600 mt-2 whitespace-pre-wrap leading-relaxed">
                    <MapPin className="w-3.5 h-3.5 inline mr-1 text-purple-500" />
                    {customerInfo.address}
                  </p>
                )}
              </div>
              {isEditMode && (
                <div className="relative shrink-0">
                  <button
                    onClick={() => setShowOrderActions((open) => !open)}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    title="Order actions"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                  </button>
                  {showOrderActions && (
                    <div className="absolute right-0 top-11 z-30 w-56 rounded-xl border bg-white shadow-xl py-1 text-gray-700">
                      <button onClick={() => { setShowOrderActions(false); }} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50">Edit order</button>
                      <button onClick={openChangeOrderType} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50">Change order type</button>
                      <button onClick={openChangeTable} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50">Change table</button>
                      <button onClick={handleReprintOrderToKds} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50">Reprint order to KDS</button>
                      <button onClick={() => { printBill(buildOrder()); setShowOrderActions(false); }} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50">Reprint bill</button>
                      <button onClick={() => void handleVoidTicket()} className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">Void ticket</button>
                    </div>
                  )}
                </div>
              )}
            </div>
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
                        {item.options && item.options.length > 0 && (
                          <p className="text-xs text-gray-500">{item.options.map((o) => o.name).join(', ')}</p>
                        )}
                        <p className="text-xs text-gray-500">RM{item.unitPrice.toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 bg-white border rounded-lg flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
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
              <button 
                onClick={() => handleSaveOrder(false)} 
                disabled={cartItems.length === 0} 
                className="py-3 bg-gray-200 text-gray-800 rounded-xl font-semibold hover:bg-gray-300 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" /> Save
              </button>
              <button
                onClick={() => handleSaveOrder(true)}
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
            <button
              onClick={() => navigate('/dashboard')}
              className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-xl transition-colors"
              aria-label="Cancel new order"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Select Order Type</h2>
            <p className="text-center text-gray-500 mb-8">How will this order be served?</p>
            <div className="space-y-4">
              {([
                { type: 'dine-in' as OrderTypeString, label: 'Dine In', desc: 'Customer eats at table', icon: Home },
                { type: 'takeaway' as OrderTypeString, label: 'Takeaway', desc: 'Customer picks up order', icon: ShoppingBag },
                { type: 'delivery' as OrderTypeString, label: 'Delivery', desc: 'Order delivered to address', icon: Car },
                { type: 'reservation' as OrderTypeString, label: 'Reservation', desc: 'Book table for later', icon: Calendar },
              ]).map(({ type, label, desc, icon: Icon }) => {
                const styles = orderTypeStyles[type];
                const isSelected = orderType === type;
                return (
                  <button 
                    key={type} 
                    onClick={() => setOrderType(type)} 
                    className={`w-full p-5 rounded-2xl border-2 transition-all flex items-center gap-4 group ${
                      isSelected 
                        ? `${styles.border} ${styles.bg}` 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                      isSelected ? styles.iconBg : 'bg-gray-100 group-hover:bg-gray-200'
                    }`}>
                      <Icon className={`w-7 h-7 ${isSelected ? styles.iconText : 'text-gray-600'}`} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-gray-900 text-lg">{label}</h3>
                      <p className="text-sm text-gray-500">{desc}</p>
                    </div>
                    {isSelected && <Check className={`w-6 h-6 ${styles.iconText} ml-auto`} />}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button onClick={() => navigate('/dashboard')} className="py-3 bg-gray-200 text-gray-800 rounded-xl font-semibold hover:bg-gray-300 active:scale-95 transition-all">Cancel</button>
              <button onClick={handleConfirmOrderType} className="py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 active:scale-95 transition-all">Continue</button>
            </div>
          </div>
        </div>
      )}

      {/* Change Order Type Modal */}
      {showChangeTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowChangeTypeModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Change Order Type</h2>
                <p className="text-sm text-gray-500">Choose the new service flow.</p>
              </div>
              <button onClick={() => setShowChangeTypeModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              {([
                { type: 'dine-in' as OrderTypeString, label: 'Dine In', desc: 'Assign a table', icon: Home },
                { type: 'takeaway' as OrderTypeString, label: 'Takeaway', desc: 'No table required', icon: ShoppingBag },
                { type: 'delivery' as OrderTypeString, label: 'Delivery', desc: 'Requires delivery address', icon: Car },
                { type: 'reservation' as OrderTypeString, label: 'Reservation', desc: 'Assign table later', icon: Calendar },
              ]).map(({ type, label, desc, icon: Icon }) => {
                const styles = orderTypeStyles[type];
                const isSelected = orderType === type;
                return (
                  <button
                    key={type}
                    onClick={() => applyChangedOrderType(type)}
                    className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${
                      isSelected ? `${styles.border} ${styles.bg}` : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${isSelected ? styles.iconBg : 'bg-gray-100'}`}>
                      <Icon className={`w-5 h-5 ${isSelected ? styles.iconText : 'text-gray-600'}`} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-gray-900">{label}</h3>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                    {isSelected && <Check className={`w-5 h-5 ${styles.iconText} ml-auto`} />}
                  </button>
                );
              })}
            </div>
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
                  onClick={() => table.status === 'AVAILABLE' && setSelectedTableId(table.id)}
                  disabled={table.status !== 'AVAILABLE'}
                  className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${
                    table.status === 'AVAILABLE'
                      ? selectedTableId === table.id
                        ? 'border-emerald-500 bg-emerald-100 ring-2 ring-emerald-500 ring-offset-2'
                        : 'border-emerald-200 bg-emerald-50 hover:border-emerald-500 hover:bg-emerald-100 active:scale-95'
                      : 'opacity-50 cursor-not-allowed ' + (table.status === 'OCCUPIED' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50')
                  }`}
                >
                  <span className="text-lg font-bold text-gray-900">{table.number}</span>
                  <span className={`text-xs font-medium ${table.status === 'AVAILABLE' ? 'text-emerald-600' : table.status === 'OCCUPIED' ? 'text-red-600' : 'text-amber-600'}`}>{table.status.toLowerCase()}</span>
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
            <p className="text-sm text-gray-500 mb-6">Book first, assign a table later from reservations.</p>
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={customerInfo.name} onChange={(e) => setCustomerInfo((p: CustomerInfo) => ({ ...p, name: e.target.value }))} placeholder="Enter name" className="w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="tel" value={customerInfo.phone} onChange={(e) => setCustomerInfo((p: CustomerInfo) => ({ ...p, phone: e.target.value }))} placeholder="Enter phone" className="w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
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
                    Order @ Counter
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea value={customerInfo.note || ''} onChange={(e) => setCustomerInfo((p: CustomerInfo) => ({ ...p, note: e.target.value }))} 
                placeholder="Any special requests..." rows={2} className="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button onClick={() => navigate('/dashboard')} className="py-3 bg-gray-200 text-gray-800 rounded-xl font-semibold hover:bg-gray-300 active:scale-95 transition-all">Cancel</button>
              <button onClick={handleFinalizeOrder} className="py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 active:scale-95 transition-all flex items-center justify-center gap-2">
                <Check className="w-5 h-5" /> Confirm
              </button>
            </div>
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
                  <input type="text" value={customerInfo.name} onChange={(e) => setCustomerInfo((p: CustomerInfo) => ({ ...p, name: e.target.value }))} 
                  placeholder="Enter name" className="w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="tel" value={customerInfo.phone} onChange={(e) => setCustomerInfo((p: CustomerInfo) => ({ ...p, phone: e.target.value }))} 
                  placeholder="Enter phone number" className="w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
                </div>
              </div>
              {orderType === 'delivery' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address *</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <textarea value={customerInfo.address || ''} onChange={(e) => setCustomerInfo((p: CustomerInfo) => ({ ...p, address: e.target.value }))} 
                    placeholder="Enter delivery address" rows={3} className="w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none" />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
                <textarea value={customerInfo.note || ''} onChange={(e) => setCustomerInfo((p: CustomerInfo) => ({ ...p, note: e.target.value }))} 
                placeholder="Any special instructions..." rows={2} className="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none" />
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
              <div className="text-5xl mb-3">{selectedMenuItem.imageUrl ? '📷' : '🍽️'}</div>
              <h2 className="text-xl font-bold text-gray-900">{selectedMenuItem.name}</h2>
              <p className="text-lg font-bold text-primary-600">RM{(Number(selectedMenuItem.price) || 0).toFixed(2)}</p>
            </div>
            <div className="space-y-3 mb-6">
              <p className="text-sm font-medium text-gray-700">Select Options:</p>
              {getOptionLabels(selectedMenuItem.options).map((opt) => (
                <label key={opt} onClick={() => toggleModifier(opt)} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedModifiers.includes(opt) ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${selectedModifiers.includes(opt) ? 'bg-primary-600 border-primary-600' : 'border-gray-300'}`}>
                    {selectedModifiers.includes(opt) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{opt}</span>
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
