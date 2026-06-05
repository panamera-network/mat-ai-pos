// apps/qr-menu/src/pages/CartPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, User, Phone, MapPin, Users, Clock, Table } from 'lucide-react';

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
  name: string;
  capacity: number;
}

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('mat-qr-cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [orderType, setOrderType] = useState<'DINE_IN' | 'PICKUP' | 'DELIVERY' | 'RESERVATION'>('DINE_IN');
  const [tables, setTables] = useState<TableData[]>([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [pax, setPax] = useState(1);
  const [reservationTime, setReservationTime] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch tables for dine-in
  useEffect(() => {
    if (orderType === 'DINE_IN' || orderType === 'RESERVATION') {
      fetch(`${API_URL}/tables`)
        .then(res => res.json())
        .then(data => setTables(data))
        .catch(err => console.error('Failed to load tables:', err));
    }
  }, [orderType]);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handleSubmit = async () => {
    if (cart.length === 0) {
      setError('Cart is empty');
      return;
    }

    // Validation
    if (!customerName || !customerPhone) {
      setError('Please fill in required fields');
      return;
    }

    if ((orderType === 'DINE_IN' || orderType === 'RESERVATION') && !selectedTable) {
      setError('Please select a table');
      return;
    }

    if (orderType === 'DELIVERY' && !customerAddress) {
      setError('Please enter delivery address');
      return;
    }

    if (orderType === 'RESERVATION' && !reservationTime) {
      setError('Please select reservation time');
      return;
    }

    setSubmitting(true);
    setError('');

    const orderData = {
      type: orderType,
      totalAmount: cartTotal,
      customerName,
      customerPhone,
      customerAddress: orderType === 'DELIVERY' ? customerAddress : undefined,
      tableId: (orderType === 'DINE_IN' || orderType === 'RESERVATION') ? selectedTable : undefined,
      pax: (orderType === 'DINE_IN' || orderType === 'RESERVATION') ? pax : undefined,
      reservationTime: orderType === 'RESERVATION' ? new Date(reservationTime).toISOString() : undefined,
      notes,
      items: cart.map(item => ({
        menuItemId: item.menuId,
        name: item.name,
        quantity: item.qty,
        unitPrice: item.price,
        totalPrice: item.price * item.qty,
        options: item.modifiers.length > 0 ? { modifiers: item.modifiers } : undefined,
      })),
    };

    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      
      // Clear cart
      localStorage.removeItem('mat-qr-cart');
      setCart([]);
      
      // Navigate to order status
      navigate(`/order/${data.id}`);
    } catch (err) {
      console.error('Failed to submit order:', err);
      setError('Failed to send order. Saved for retry.');
    } finally {
      setSubmitting(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/menu')} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-lg">Your Order</h1>
        </div>
      </header>

      {/* Order Type Selection */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { id: 'DINE_IN', label: '🍽️ Dine In' },
            { id: 'PICKUP', label: '🥡 Pickup' },
            { id: 'DELIVERY', label: '🛵 Delivery' },
            { id: 'RESERVATION', label: '📅 Reservation' },
          ].map(type => (
            <button
              key={type.id}
              onClick={() => setOrderType(type.id as any)}
              className={`p-3 rounded-xl text-sm font-medium border-2 transition-all ${
                orderType === type.id
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-200 bg-white text-gray-700'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Customer Info */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border">
            <User className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Your Name *"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm"
            />
          </div>

          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border">
            <Phone className="w-5 h-5 text-gray-400" />
            <input
              type="tel"
              placeholder="Phone Number *"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm"
            />
          </div>

          {/* Table Selection for Dine In / Reservation */}
          {(orderType === 'DINE_IN' || orderType === 'RESERVATION') && (
            <>
              <div className="flex items-center gap-3 bg-white p-3 rounded-xl border">
                <Table className="w-5 h-5 text-gray-400" />
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm"
                >
                  <option value="">Select Table *</option>
                  {tables.map(table => (
                    <option key={table.id} value={table.id}>
                      {table.number} - {table.name} (Capacity: {table.capacity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 bg-white p-3 rounded-xl border">
                <Users className="w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  min={1}
                  placeholder="Number of Pax"
                  value={pax}
                  onChange={(e) => setPax(Number(e.target.value))}
                  className="flex-1 bg-transparent outline-none text-sm"
                />
              </div>
            </>
          )}

          {/* Reservation Time */}
          {orderType === 'RESERVATION' && (
            <div className="flex items-center gap-3 bg-white p-3 rounded-xl border">
              <Clock className="w-5 h-5 text-gray-400" />
              <input
                type="datetime-local"
                value={reservationTime}
                onChange={(e) => setReservationTime(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm"
              />
            </div>
          )}

          {/* Delivery Address */}
          {orderType === 'DELIVERY' && (
            <div className="flex items-center gap-3 bg-white p-3 rounded-xl border">
              <MapPin className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Delivery Address *"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm"
              />
            </div>
          )}

          {/* Notes */}
          <div className="bg-white p-3 rounded-xl border">
            <textarea
              placeholder="Special instructions (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-transparent outline-none text-sm resize-none"
              rows={2}
            />
          </div>
        </div>

        {/* Cart Items */}
        <div className="bg-white rounded-2xl border overflow-hidden mb-4">
          {cart.map((item, idx) => (
            <div key={idx} className="p-4 border-b last:border-b-0 flex justify-between items-start">
              <div>
                <p className="font-medium text-sm">{item.name}</p>
                {item.modifiers.length > 0 && (
                  <p className="text-xs text-gray-500">{item.modifiers.join(', ')}</p>
                )}
                <p className="text-sm text-gray-500">x{item.qty}</p>
              </div>
              <p className="font-semibold text-sm">RM{(item.price * item.qty).toFixed(2)}</p>
            </div>
          ))}
          <div className="p-4 bg-gray-50 flex justify-between items-center">
            <span className="font-bold">Total</span>
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
              <span>Place Order</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};