// apps/pos/src/pages/POSPage.tsx
import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';

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
// DEMO DATA
// ============================================
const categories = [
  { id: '1', name: 'Pizza', icon: '🍕' },
  { id: '2', name: 'Pasta', icon: '🍝' },
  { id: '3', name: 'Nasi', icon: '🍚' },
  { id: '4', name: 'Beverages', icon: '🥤' },
  { id: '5', name: 'Side Order', icon: '🍟' },
  { id: '6', name: 'Extras', icon: '➕' },
];

const demoMenuItems = [
  { id: '1', name: 'Margherita', price: 25, categoryId: '1', image: '🍕', modifiers: ['Thin Crust +RM0', 'Cheese Crust +RM3', 'Extra Cheese +RM5'] },
  { id: '2', name: 'Pepperoni', price: 28, categoryId: '1', image: '🍕', modifiers: ['Thin Crust +RM0', 'Cheese Crust +RM3', 'Extra Cheese +RM5'] },
  { id: '3', name: 'Hawaiian', price: 27, categoryId: '1', image: '🍕', modifiers: ['Thin Crust +RM0', 'Cheese Crust +RM3'] },
  { id: '4', name: 'Seafood', price: 35, categoryId: '1', image: '🍕', modifiers: ['Thin Crust +RM0', 'Extra Seafood +RM8'] },
  { id: '5', name: 'Chicken', price: 30, categoryId: '1', image: '🍕', modifiers: ['Thin Crust +RM0', 'Cheese Crust +RM3'] },
  { id: '6', name: 'Carbonara', price: 22, categoryId: '2', image: '🍝', modifiers: ['Extra Cheese +RM3'] },
  { id: '7', name: 'Bolognese', price: 24, categoryId: '2', image: '🍝', modifiers: ['Extra Cheese +RM3'] },
  { id: '8', name: 'Aglio Olio', price: 20, categoryId: '2', image: '🍝', modifiers: ['Extra Cheese +RM3', 'Spicy +RM0'] },
  { id: '9', name: 'Nasi Goreng', price: 15, categoryId: '3', image: '🍚', modifiers: ['Extra Egg +RM2', 'Spicy +RM0'] },
  { id: '10', name: 'Nasi Lemak', price: 12, categoryId: '3', image: '🍚', modifiers: ['Extra Egg +RM2', 'Spicy +RM0'] },
  { id: '11', name: 'Pepsi', price: 5, categoryId: '4', image: '🥤', modifiers: [] },
  { id: '12', name: 'Coke', price: 5, categoryId: '4', image: '🥤', modifiers: [] },
  { id: '13', name: 'Teh Tarik', price: 4, categoryId: '4', image: '🥤', modifiers: [] },
  { id: '14', name: 'Fries', price: 8, categoryId: '5', image: '🍟', modifiers: ['Cheese +RM3'] },
  { id: '15', name: 'Wedges', price: 10, categoryId: '5', image: '🍟', modifiers: ['Cheese +RM3'] },
  { id: '16', name: 'Extra Cheese', price: 5, categoryId: '6', image: '➕', modifiers: [] },
  { id: '17', name: 'Extra Sauce', price: 3, categoryId: '6', image: '➕', modifiers: [] },
];

// Get tables from settings (localStorage) or default
const getTables = () => {
  try {
    const saved = localStorage.getItem('mat-pos-tables');
    if (saved) return JSON.parse(saved);
  } catch {
    // corrupt data, fallthrough
  }
  return Array.from({ length: 20 }, (_, i) => ({
    id: (i + 1).toString(),
    number: `T${String(i + 1).padStart(2, '0')}`,
    status: i < 5 ? 'occupied' : i < 7 ? 'reserved' : 'available',
  }));
};

// ============================================
// HELPERS
// ============================================
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

const updateTableStatus = (tableNumber: string, status: 'available' | 'occupied' | 'reserved') => {
  try {
    const tables = getTables();
    const updated = tables.map((t: any) =>
      t.number === tableNumber ? { ...t, status } : t
    );
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
  const existingOrder = location.state?.orderItems as OrderItem[] | undefined;
  const existingTable = location.state?.tableNumber as string | undefined;
  const existingOrderType = location.state?.orderType as OrderType | undefined;
  const existingCustomer = location.state?.customerInfo as CustomerInfo | undefined;
  const existingOrderId = location.state?.orderId as string | undefined;
  const existingCreatedAt = location.state?.createdAt as string | undefined;

  const [activeCategory, setActiveCategory] = useState('1');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>(existingOrder || []);
  const [orderType, setOrderType] = useState<OrderType>(existingOrderType || 'dine-in');
  const [selectedTable, setSelectedTable] = useState<string>(existingTable || '');
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>(
    existingCustomer || { name: '', phone: '' }
  );

  // Modals
  const [showOrderTypeModal, setShowOrderTypeModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showModifierModal, setShowModifierModal] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<typeof demoMenuItems[0] | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);

  const tables = useMemo(() => getTables(), []);
  const availableTables = tables.filter((t: any) => t.status === 'available');

  // Filter: search = all categories, no search = active category only
  const filteredItems = searchQuery
    ? demoMenuItems.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : demoMenuItems.filter((item) => item.categoryId === activeCategory);

  const addToOrder = (item: typeof demoMenuItems[0], modifiers: string[] = []) => {
    setOrderItems((prev) => {
      const existing = prev.find((i) => i.menuId === item.id && JSON.stringify(i.modifiers) === JSON.stringify(modifiers));
      if (existing) {
        return prev.map((i) =>
          i.menuId === item.id && JSON.stringify(i.modifiers) === JSON.stringify(modifiers)
            ? { ...i, qty: i.qty + 1 }
            : i
        );
      }
      return [...prev, {
        id: typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2) + Date.now().toString(36),
        menuId: item.id,
        name: item.name,
        price: item.price,
        qty: 1,
        modifiers,
      }];
    });
  };

  const handleMenuItemClick = (item: typeof demoMenuItems[0]) => {
    if (item.modifiers && item.modifiers.length > 0) {
      setSelectedMenuItem(item);
      setSelectedModifiers([]);
      setShowModifierModal(true);
    } else {
      addToOrder(item);
    }
  };

  const handleSaveModifier = () => {
    if (selectedMenuItem) {
      addToOrder(selectedMenuItem, selectedModifiers);
      setShowModifierModal(false);
      setSelectedMenuItem(null);
      setSelectedModifiers([]);
    }
  };

  const updateQty = (id: string, delta: number) => {
    setOrderItems((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, qty: Math.max(0, item.qty + delta) } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const removeItem = (id: string) => {
    setOrderItems((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  // SAVE: Edit mode → save terus. New order → pop-up order type.
  const handleSaveOrder = () => {
    if (isEditMode && existingOrderId) {
      // Edit existing order
      const updatedOrder: Order = {
        id: existingOrderId,
        items: orderItems,
        type: orderType,
        status: 'active',
        tableNumber: orderType === 'dine-in' ? selectedTable : undefined,
        customerInfo: (orderType === 'takeaway' || orderType === 'delivery') ? customerInfo : undefined,
        subtotal,
        tax,
        total,
        createdAt: existingCreatedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveOrder(updatedOrder);
      if (orderType === 'dine-in' && selectedTable) {
        updateTableStatus(selectedTable, 'occupied');
      }
      navigate('/dashboard');
    } else {
      // New order flow
      setShowOrderTypeModal(true);
    }
  };

  // Confirm order type after save
  const handleConfirmOrderType = () => {
    if (orderType === 'dine-in') {
      setShowOrderTypeModal(false);
      setShowTableModal(true);
    } else {
      setShowOrderTypeModal(false);
      setShowCustomerModal(true);
    }
  };

  // After table/customer select, save and back to dashboard
  const handleFinalizeOrder = () => {
    if (orderType === 'dine-in' && !selectedTable) {
      alert('Please select a table');
      return;
    }
    if ((orderType === 'takeaway' || orderType === 'delivery') && !customerInfo.name) {
      alert('Please enter customer name');
      return;
    }

    const orderId = `ORD-${Date.now()}`;

    const newOrder: Order = {
      id: orderId,
      items: orderItems,
      type: orderType,
      status: 'active',
      tableNumber: orderType === 'dine-in' ? selectedTable : undefined,
      customerInfo: (orderType === 'takeaway' || orderType === 'delivery') ? customerInfo : undefined,
      subtotal,
      tax,
      total,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveOrder(newOrder);

    if (orderType === 'dine-in' && selectedTable) {
      updateTableStatus(selectedTable, 'occupied');
    }

    setShowOrderTypeModal(false);
    setShowTableModal(false);
    setShowCustomerModal(false);
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
          {/* Category Tabs - hide when searching */}
          {!searchQuery && (
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
                  <span className="mr-1">{cat.icon}</span>
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Menu Grid */}
          <div className="flex-1 overflow-auto p-4">
            <div className="grid grid-cols-4 gap-3">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleMenuItemClick(item)}
                  className="bg-white rounded-xl border-2 border-gray-200 p-4 hover:border-primary-400 hover:shadow-md active:scale-95 transition-all flex flex-col items-center"
                >
                  <div className="text-5xl mb-3">{item.image}</div>
                  <p className="text-sm font-medium text-gray-900 text-center leading-tight">{item.name}</p>
                  <p className="text-lg font-bold text-primary-600 mt-2">RM{item.price}</p>
                  {item.modifiers.length > 0 && (
                    <span className="text-xs text-gray-400 mt-1">+ options</span>
                  )}
                </button>
              ))}
            </div>
            {filteredItems.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <p>No items found</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Order Cart */}
        <div className="w-[360px] bg-white border-l flex flex-col">
          {/* Order Header */}
          <div className="p-4 border-b">
            <h2 className="font-bold text-gray-900">{isEditMode ? 'Edit Order' : 'New Order'}</h2>
            {isEditMode && selectedTable && <p className="text-sm text-gray-500 mt-1">Table: {selectedTable}</p>}
            {isEditMode && customerInfo.name && (
              <p className="text-sm text-gray-500 mt-1">Customer: {customerInfo.name}</p>
            )}
          </div>

          {/* Order Items */}
          <div className="flex-1 overflow-auto p-4">
            {orderItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <ShoppingBag className="w-12 h-12 mb-2" />
                <p className="text-sm">No items yet</p>
                <p className="text-xs">Tap menu to add</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orderItems.map((item) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                        {item.modifiers && item.modifiers.length > 0 && (
                          <p className="text-xs text-gray-500">{item.modifiers.join(', ')}</p>
                        )}
                        <p className="text-xs text-gray-500">RM{item.price} each</p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="w-8 h-8 bg-white border rounded-lg flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-bold w-6 text-center">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className="w-8 h-8 bg-white border rounded-lg flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center hover:bg-red-100 ml-1 transition-colors"
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Footer */}
          <div className="p-4 border-t bg-gray-50">
            <div className="space-y-1.5 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">RM{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">SST (8%)</span>
                <span className="font-medium">RM{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                <span>Total</span>
                <span className="text-primary-600">RM{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleSaveOrder}
                disabled={orderItems.length === 0}
                className="py-3 bg-gray-200 text-gray-800 rounded-xl font-semibold hover:bg-gray-300 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" /> Save
              </button>
              <button
                onClick={() => navigate('/payment/001', { state: { orderItems, total } })}
                disabled={orderItems.length === 0}
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
              <button
                onClick={() => setOrderType('dine-in')}
                className={`w-full p-5 rounded-2xl border-2 transition-all flex items-center gap-4 group ${
                  orderType === 'dine-in' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                }`}
              >
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <Home className="w-7 h-7 text-blue-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-gray-900 text-lg">Dine In</h3>
                  <p className="text-sm text-gray-500">Customer eats at table</p>
                </div>
                {orderType === 'dine-in' && <Check className="w-6 h-6 text-blue-600 ml-auto" />}
              </button>

              <button
                onClick={() => setOrderType('takeaway')}
                className={`w-full p-5 rounded-2xl border-2 transition-all flex items-center gap-4 group ${
                  orderType === 'takeaway' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-500 hover:bg-orange-50'
                }`}
              >
                <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                  <ShoppingBag className="w-7 h-7 text-orange-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-gray-900 text-lg">Takeaway</h3>
                  <p className="text-sm text-gray-500">Customer picks up order</p>
                </div>
                {orderType === 'takeaway' && <Check className="w-6 h-6 text-orange-600 ml-auto" />}
              </button>

              <button
                onClick={() => setOrderType('delivery')}
                className={`w-full p-5 rounded-2xl border-2 transition-all flex items-center gap-4 group ${
                  orderType === 'delivery' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-500 hover:bg-purple-50'
                }`}
              >
                <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <Car className="w-7 h-7 text-purple-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-gray-900 text-lg">Delivery</h3>
                  <p className="text-sm text-gray-500">Order delivered to address</p>
                </div>
                {orderType === 'delivery' && <Check className="w-6 h-6 text-purple-600 ml-auto" />}
              </button>
            </div>

            <button
              onClick={handleConfirmOrderType}
              className="w-full mt-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 active:scale-95 transition-all"
            >
              Continue
            </button>
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
              <button onClick={() => setShowTableModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3 max-h-[400px] overflow-auto">
              {tables.map((table: any) => (
                <button
                  key={table.id}
                  onClick={() => {
                    if (table.status === 'available') {
                      setSelectedTable(table.number);
                    }
                  }}
                  disabled={table.status !== 'available'}
                  className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${
                    table.status === 'available'
                      ? selectedTable === table.number
                        ? 'border-emerald-500 bg-emerald-100 ring-2 ring-emerald-500 ring-offset-2'
                        : 'border-emerald-200 bg-emerald-50 hover:border-emerald-500 hover:bg-emerald-100 active:scale-95'
                      : table.status === 'occupied'
                      ? 'border-red-200 bg-red-50 opacity-50 cursor-not-allowed'
                      : 'border-amber-200 bg-amber-50 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <span className="text-lg font-bold text-gray-900">{table.number}</span>
                  <span className={`text-xs font-medium ${
                    table.status === 'available' ? 'text-emerald-600' :
                    table.status === 'occupied' ? 'text-red-600' : 'text-amber-600'
                  }`}>
                    {table.status}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={handleFinalizeOrder}
              disabled={!selectedTable}
              className="w-full mt-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" /> Confirm & Save
            </button>
          </div>
        </div>
      )}

      {/* Customer Info Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {orderType === 'takeaway' ? 'Takeaway Details' : 'Delivery Details'}
            </h2>
            <p className="text-sm text-gray-500 mb-6">Enter customer information</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter name"
                    className="w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo((prev: any) => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                    className="w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
              </div>

              {orderType === 'delivery' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <textarea
                      value={customerInfo.address || ''}
                      onChange={(e) => setCustomerInfo((prev: any) => ({ ...prev, address: e.target.value }))}
                      placeholder="Enter delivery address"
                      rows={3}
                      className="w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
                <textarea
                  value={customerInfo.note || ''}
                  onChange={(e) => setCustomerInfo((prev: any) => ({ ...prev, note: e.target.value }))}
                  placeholder="Any special instructions..."
                  rows={2}
                  className="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none"
                />
              </div>
            </div>

            <button
              onClick={handleFinalizeOrder}
              className="w-full mt-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
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
              <div className="text-5xl mb-3">{selectedMenuItem.image}</div>
              <h2 className="text-xl font-bold text-gray-900">{selectedMenuItem.name}</h2>
              <p className="text-lg font-bold text-primary-600">RM{selectedMenuItem.price}</p>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-sm font-medium text-gray-700">Select Options:</p>
              {selectedMenuItem.modifiers.map((mod) => (
                <label
                  key={mod}
                  onClick={() => toggleModifier(mod)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedModifiers.includes(mod)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    selectedModifiers.includes(mod) ? 'bg-primary-600 border-primary-600' : 'border-gray-300'
                  }`}>
                    {selectedModifiers.includes(mod) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{mod}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModifierModal(false)}
                className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-xl font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveModifier}
                className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" /> Add to Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};