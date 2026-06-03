import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, Trash2, Send, User, Phone, MapPin, Clock, Users, MessageSquare, AlertCircle } from 'lucide-react';
import { submitOrder, initSync } from '../lib/sync';
import type { Order, OrderItem } from '@mat-ai/types';

interface CartItem {
  menuId: string;
  name: string;
  price: number;
  qty: number;
  modifiers: string[];
}

const getCart = (): CartItem[] => {
  const saved = localStorage.getItem('mat-qr-cart');
  return saved ? JSON.parse(saved) : [];
};

const clearCart = () => localStorage.removeItem('mat-qr-cart');

const getOrderType = (): string => {
  return localStorage.getItem('mat-qr-order-type') || 'dine-in';
};

const getTableFromQR = (): string => {
  return localStorage.getItem('mat-qr-table') || '';
};

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>(getCart);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    method: 'ws' | 'telegram' | 'failed';
    message: string;
  } | null>(null);

  // Order type
  const orderType = getOrderType();

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [tableNumber, setTableNumber] = useState(getTableFromQR());
  const [pax, setPax] = useState('');
  const [reservationTime, setReservationTime] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [orderTiming, setOrderTiming] = useState<'now' | 'later'>('now');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const updateQty = (index: number, delta: number) => {
    setCart((prev) => {
      const updated = prev
        .map((item, i) => (i === index ? { ...item, qty: Math.max(0, item.qty + delta) } : item))
        .filter((item) => item.qty > 0);
      localStorage.setItem('mat-qr-cart', JSON.stringify(updated));
      return updated;
    });
  };

  const removeItem = (index: number) => {
    setCart((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      localStorage.setItem('mat-qr-cart', JSON.stringify(updated));
      return updated;
    });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!customerName.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!customerPhone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (orderType === 'dine-in' && !tableNumber.trim()) {
      newErrors.table = 'Table number is required';
    }

    if (orderType === 'reservation') {
      if (!reservationTime) {
        newErrors.time = 'Reservation time is required';
      }
      if (!pax.trim()) {
        newErrors.pax = 'Number of pax is required';
      }
    }

    if (orderType === 'delivery' && !address.trim()) {
      newErrors.address = 'Delivery address is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (cart.length === 0) return;
    if (!validate()) return;

    setSubmitting(true);
    setSubmitResult(null);

    // Init sync (connect WS)
    const cleanup = initSync();

    // Build order items
    const orderItems: OrderItem[] = cart.map((item) => ({
      menuItemId: item.menuId,
      name: item.name,
      categoryId: '',
      qty: item.qty,
      price: item.price,
      modifiers: item.modifiers.map((mod) => ({
        modifierId: mod,
        name: mod.replace(/\s*\+RM\d+/, ''),
        price: parseFloat(mod.match(/\+RM(\d+(?:\.\d+)?)/)?.[1] || '0'),
      })),
      subtotal: item.price * item.qty,
    }));

    // Generate order number (daily reset format: A001)
    const today = new Date().toISOString().split('T')[0];
    const dailyKey = `mat-qr-order-count-${today}`;
    const currentCount = parseInt(localStorage.getItem(dailyKey) || '0');
    const newCount = currentCount + 1;
    localStorage.setItem(dailyKey, String(newCount));
    const orderNumber = `Q${String(newCount).padStart(3, '0')}`;

    const orderId = `QR-${Date.now()}`;

    const order: Order = {
      id: orderId,
      orderNumber,
      items: orderItems,
      orderType: orderType as any,
      tableNumber: orderType === 'dine-in' || orderType === 'reservation' ? tableNumber : undefined,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      address: orderType === 'delivery' ? address.trim() : undefined,
      reservationTime: orderType === 'reservation' ? reservationTime : undefined,
      pax: pax ? parseInt(pax) : undefined,
      notes: notes.trim() || undefined,
      orderTiming: orderType === 'reservation' ? orderTiming : 'now',
      subtotal,
      tax,
      total,
      finalTotal: total,
      status: 'pending',
      kitchenStatus: 'pending',
      cashierId: 'qr-system',
      cashierName: 'QR Order',
      orderedAt: new Date().toISOString(),
      isQrOrder: true,
      qrOrderId: orderId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Submit
    try {
      const result = await submitOrder(order);

      if (result.success) {
        if (result.method === 'ws') {
          setSubmitResult({
            success: true,
            method: 'ws',
            message: 'Order sent to kitchen!',
          });
        } else {
          setSubmitResult({
            success: true,
            method: 'telegram',
            message: 'Order sent to cashier via Telegram. Please wait for confirmation.',
          });
        }
        clearCart();
        setTimeout(() => {
          navigate(`/status/${orderId}`);
        }, 2000);
      } else {
        setSubmitResult({
          success: false,
          method: 'failed',
          message: 'Failed to send order. Saved for retry.',
        });
      }
    } catch (err) {
      setSubmitResult({
        success: false,
        method: 'failed',
        message: 'Network error. Please try again.',
      });
    } finally {
      setSubmitting(false);
      cleanup();
    }
  };

  // Form field helper
  const Field = ({ 
    label, 
    icon: Icon, 
    error, 
    children 
  }: { 
    label: string; 
    icon: any; 
    error?: string; 
    children: React.ReactNode 
  }) => (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
        <Icon className="w-4 h-4 text-gray-400" />
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );

  if (cart.length === 0 && !submitResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4">
          <ShoppingCart className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Your cart is empty</h2>
        <p className="text-gray-500 mt-1">Add some delicious items!</p>
        <button
          onClick={() => navigate('/menu')}
          className="mt-6 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold"
        >
          Browse Menu
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/menu')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-bold text-lg">Your Cart</h1>
          <p className="text-xs text-gray-500 capitalize">{orderType.replace('-', ' ')}</p>
        </div>
      </header>

      {/* Submit Result */}
      {submitResult && (
        <div className={`mx-4 mt-4 p-4 rounded-xl ${
          submitResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <p className={`text-sm font-medium ${
            submitResult.success ? 'text-green-800' : 'text-red-800'
          }`}>
            {submitResult.message}
          </p>
          {submitResult.method === 'telegram' && (
            <p className="text-xs text-green-600 mt-1">
              Cashier will key in your order manually.
            </p>
          )}
        </div>
      )}

      {/* Cart Items */}
      <div className="p-4 space-y-3">
        {cart.map((item, index) => (
          <div key={index} className="bg-white rounded-xl border p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{item.name}</h3>
                {item.modifiers.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">{item.modifiers.join(', ')}</p>
                )}
                <p className="text-sm text-primary-600 font-medium mt-1">
                  RM{item.price.toFixed(2)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQty(index, -1)}
                  className="w-8 h-8 border rounded-lg flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-6 text-center font-medium">{item.qty}</span>
                <button
                  onClick={() => updateQty(index, 1)}
                  className="w-8 h-8 border rounded-lg flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => removeItem(index)}
                  className="w-8 h-8 text-red-500 ml-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Customer Details Form */}
      <div className="px-4 space-y-4">
        <h2 className="font-semibold text-gray-900">Order Details</h2>

        {/* Name - Required for all */}
        <Field label="Name *" icon={User} error={errors.name}>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Your full name"
            className="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </Field>

        {/* Phone - Required for all */}
        <Field label="Phone Number *" icon={Phone} error={errors.phone}>
          <input
            type="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="e.g. 012-3456789"
            className="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </Field>

        {/* Dine In / Reservation: Table */}
        {(orderType === 'dine-in' || orderType === 'reservation') && (
          <Field label="Table Number *" icon={MapPin} error={errors.table}>
            <input
              type="text"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="e.g. T01"
              className="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </Field>
        )}

        {/* Reservation: Pax + Time */}
        {orderType === 'reservation' && (
          <>
            <Field label="Number of Pax *" icon={Users} error={errors.pax}>
              <input
                type="number"
                min="1"
                value={pax}
                onChange={(e) => setPax(e.target.value)}
                placeholder="How many people?"
                className="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </Field>

            <Field label="Reservation Time *" icon={Clock} error={errors.time}>
              <input
                type="datetime-local"
                value={reservationTime}
                onChange={(e) => setReservationTime(e.target.value)}
                className="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </Field>

            {/* Order Now / Later */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Order Timing</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setOrderTiming('now')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    orderTiming === 'now'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white border text-gray-700'
                  }`}
                >
                  Order Now
                </button>
                <button
                  onClick={() => setOrderTiming('later')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    orderTiming === 'later'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white border text-gray-700'
                  }`}
                >
                  Order @ Counter
                </button>
              </div>
            </div>
          </>
        )}

        {/* Delivery: Address */}
        {orderType === 'delivery' && (
          <Field label="Delivery Address *" icon={MapPin} error={errors.address}>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full delivery address"
              rows={3}
              className="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none"
            />
          </Field>
        )}

        {/* Notes - Optional for all */}
        <Field label="Notes (optional)" icon={MessageSquare}>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special requests?"
            rows={2}
            className="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none"
          />
        </Field>
      </div>

      {/* Total & Submit */}
      <div className="fixed bottom-0 left-0 right-0 safe-bottom bg-white border-t px-4 py-4 shadow-lg">
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">RM{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">SST (8%)</span>
          <span className="font-medium">RM{tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold mb-4">
          <span>Total</span>
          <span className="text-primary-600">RM{total.toFixed(2)}</span>
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting || cart.length === 0}
          className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {submitting ? (
            <span>Sending...</span>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Place Order
            </>
          )}
        </button>
      </div>
    </div>
  );
};
