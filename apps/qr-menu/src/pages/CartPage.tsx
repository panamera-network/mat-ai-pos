// apps/qr-menu/src/pages/CartPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Plus, Minus, Trash2 } from 'lucide-react';
import type { OrderType, OrderItemInput, OrderView } from '@mat-ai/types';
import { sendFallback } from '@mat-ai/sync';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface CartItem {
  menuId: string;
  name: string;
  price: number;
  qty: number;
  modifiers: string[];
}

interface TableData {
  id: string;
  number: string;
  name?: string;
  capacity: number;
}

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('mat-qr-cart');
    return saved ? JSON.parse(saved) : [];
  });

  // Load from localStorage (set by OrderTypePage popup)
  const [orderType] = useState<OrderType>(() => {
    return (localStorage.getItem('mat-qr-order-type') as OrderType) || 'DINE_IN';
  });
  const [customerName] = useState(() => localStorage.getItem('mat-qr-customer-name') || '');
  const [customerPhone] = useState(() => localStorage.getItem('mat-qr-customer-phone') || '');
  const [customerAddress] = useState(() => localStorage.getItem('mat-qr-customer-address') || '');
  const [tableId] = useState(() => localStorage.getItem('mat-qr-table-id') || '');
  const [pax] = useState(() => Number(localStorage.getItem('mat-qr-pax') || 1));
  const [reservationTime] = useState(() => localStorage.getItem('mat-qr-reservation-time') || '');

  const [tables, setTables] = useState<TableData[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch table name for display
  useEffect(() => {
    if (tableId) {
      fetch(`${API_URL}/tables`)
        .then(res => res.json())
        .then(data => setTables(data))
        .catch(err => console.error('Failed to load tables:', err));
    }
  }, [tableId]);

  // Auto-save cart to localStorage
  useEffect(() => {
    localStorage.setItem('mat-qr-cart', JSON.stringify(cart));
  }, [cart]);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  // Update quantity (+ / -)
  const updateQty = (idx: number, delta: number) => {
    setCart(prev => {
      const updated = prev.map((item, i) => {
        if (i !== idx) return item;
        const newQty = Math.max(1, item.qty + delta);
        return { ...item, qty: newQty };
      });
      return updated;
    });
  };

  // Remove item from cart
  const removeItem = (idx: number) => {
    setCart(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (cart.length === 0) {
      setError('Cart is empty');
      return;
    }

    setSubmitting(true);
    setError('');

    // Build items array
    const items: OrderItemInput[] = cart.map(item => ({
      menuItemId: item.menuId,
      name: item.name,
      quantity: item.qty,
      unitPrice: item.price,
      totalPrice: item.price * item.qty,
      options: item.modifiers.length > 0 
        ? item.modifiers.map(m => ({
            id: m,
            name: m,
            required: false,
            multiSelect: false,
            choices: [{ id: m, name: m, priceModifier: 0, isDefault: true }]
          }))
        : undefined,
    }));

    const orderData = {
      orderNumber: `QR-${Date.now()}`,
      type: orderType,
      source: 'QR_MENU' as const,
      totalAmount: cartTotal,
      customerName,
      customerPhone,
      customerAddress: orderType === 'DELIVERY' ? customerAddress : undefined,
      tableId: (orderType === 'DINE_IN' || orderType === 'RESERVATION') ? tableId : undefined,
      pax: (orderType === 'DINE_IN' || orderType === 'RESERVATION') ? pax : undefined,
      reservationTime: orderType === 'RESERVATION' && reservationTime 
        ? new Date(reservationTime).toISOString() 
        : undefined,
      notes: undefined,
      items,
    };

    let orderView: OrderView | null = null;

    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      // Convert all Decimal strings to numbers
      const totalAmount = Number(data.totalAmount ?? 0);
      const taxAmount = Number(data.taxAmount ?? 0);

      orderView = {
        ...data,
        totalAmount,
        paidAmount: data.paidAmount ? Number(data.paidAmount) : undefined,
        taxAmount,
        subtotal: totalAmount,
        tax: taxAmount,
        finalTotal: totalAmount + taxAmount,
        tableNumber: tables.find(t => t.id === tableId)?.number,
        items: (data.items || []).map((item: any) => ({
          ...item,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
        })),
      };

      // Save to localStorage
      const existingOrders = JSON.parse(localStorage.getItem('mat-pos-active-orders') || '[]');
      existingOrders.push(orderView);
      localStorage.setItem('mat-pos-active-orders', JSON.stringify(existingOrders));

      // Clear cart + form data
      localStorage.removeItem('mat-qr-cart');
      localStorage.removeItem('mat-qr-order-type');
      localStorage.removeItem('mat-qr-customer-name');
      localStorage.removeItem('mat-qr-customer-phone');
      localStorage.removeItem('mat-qr-customer-address');
      localStorage.removeItem('mat-qr-table-id');
      localStorage.removeItem('mat-qr-pax');
      localStorage.removeItem('mat-qr-reservation-time');
      setCart([]);

      navigate(`/status/${data.id}`);
    } catch (err) {
      console.error('Failed to submit order:', err);

      // FALLBACK: POS offline
      const settings = JSON.parse(localStorage.getItem('mat-pos-settings') || '{}');

      if (settings.fallbackChannel && settings.fallbackChannel !== 'none') {
        // Build fallback order from cart if orderView not available
        const fallbackOrder = orderView || buildFallbackOrder(orderData, tables, tableId);
        const result = await sendFallback(fallbackOrder, settings);

        if (result.success) {
          alert(`Order sent via ${result.method}! Please wait for confirmation.`);
          navigate(`/status/fallback?method=${result.method}`);
        } else {
          setError('Failed to send order. Please try again or contact staff.');
        }
      } else {
        setError('Failed to send order. POS is offline.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to build fallback order from cart data
  function buildFallbackOrder(
    orderData: any, 
    tables: TableData[], 
    tableId: string
  ): OrderView {
    return {
      id: 'fallback-' + Date.now(),
      orderNumber: 'FB-' + Date.now(),
      type: orderData.type,
      source: 'QR_MENU',
      status: 'PENDING',
      totalAmount: orderData.totalAmount,
      paidAmount: undefined,
      taxAmount: 0,
      subtotal: orderData.totalAmount,
      tax: 0,
      finalTotal: orderData.totalAmount,
      tableNumber: tables.find(t => t.id === tableId)?.number,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      customerAddress: orderData.customerAddress,
      items: orderData.items.map((item: any) => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as OrderView;
  }

  if (cart.length === 0 && !submitting) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Add some items to get started</p>
        <button
          onClick={() => navigate('/menu')}
          className="px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold"
        >
          Browse Menu
        </button>
      </div>
    );
  }

  const tableName = tables.find(t => t.id === tableId)?.number;

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/menu')} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-lg">Your Order</h1>
          <span className="ml-auto text-sm text-gray-500">{cartCount} items</span>
        </div>
      </header>

      <div className="p-4">
        {/* Order Info Summary */}
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-3 mb-4 text-sm">
          <p className="font-medium text-primary-800">
            {orderType === 'DINE_IN' && '🍽️ Dine In'}
            {orderType === 'PICKUP' && '🥡 Pickup'}
            {orderType === 'DELIVERY' && '🛵 Delivery'}
            {orderType === 'RESERVATION' && '📅 Reservation'}
          </p>
          <p className="text-primary-600">{customerName} • {customerPhone}</p>
          {tableName && <p className="text-primary-600">Table: {tableName} ({pax} pax)</p>}
          {customerAddress && <p className="text-primary-600">📍 {customerAddress}</p>}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Cart Items */}
        <div className="bg-white rounded-2xl border overflow-hidden mb-4">
          {cart.map((item, idx) => (
            <div key={idx} className="p-4 border-b last:border-b-0">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.name}</p>
                  {item.modifiers.length > 0 && (
                    <p className="text-xs text-gray-500">{item.modifiers.join(', ')}</p>
                  )}
                  <p className="text-sm text-primary-600 font-semibold">
                    RM{item.price.toFixed(2)} each
                  </p>
                </div>
                <button
                  onClick={() => removeItem(idx)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQty(idx, -1)}
                    disabled={item.qty <= 1}
                    className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-semibold text-sm">{item.qty}</span>
                  <button
                    onClick={() => updateQty(idx, 1)}
                    className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="font-bold text-sm text-primary-600">
                  RM{(item.price * item.qty).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
          <div className="p-4 bg-gray-50 flex justify-between items-center">
            <span className="font-bold">Total ({cartCount} items)</span>
            <span className="font-bold text-lg text-primary-600">RM{cartTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 safe-bottom bg-white border-t px-4 py-3">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {submitting ? (
            <span>Sending...</span>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Place Order • RM{cartTotal.toFixed(2)}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};