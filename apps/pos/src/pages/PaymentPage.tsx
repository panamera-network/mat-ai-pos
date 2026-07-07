// apps/pos/src/pages/PaymentPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Banknote, QrCode, CreditCard, Check, 
  BikeIcon,
} from 'lucide-react';
import type { Order, PaymentMethod } from '@mat-ai/types';
import { normalizeBackendOrder, generateReceipt } from '../lib/types';
import { db } from '@mat-ai/db';
import { syncQueue } from '@mat-ai/sync';
import { useAuthStore } from '@mat-ai/backoffice';
import { printReceipt } from '../lib/print';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const updateLocalTableStatus = (tableId: string, status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING') => {
  try {
    const tables = JSON.parse(localStorage.getItem('mat-pos-tables') || '[]');
    const updated = Array.isArray(tables)
      ? tables.map((table) => table.id === tableId ? { ...table, status } : table)
      : [];
    localStorage.setItem('mat-pos-tables', JSON.stringify(updated));
  } catch {
    // local table cache is best-effort only
  }
};

interface PaymentMethodOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  backendValue: PaymentMethod;
}

const paymentMethods: PaymentMethodOption[] = [
  { id: 'cash', name: 'Cash', icon: <Banknote className="w-6 h-6" />, color: 'bg-green-500', backendValue: 'CASH' },
  { id: 'qr', name: 'QR Pay', icon: <QrCode className="w-6 h-6" />, color: 'bg-blue-500', backendValue: 'QR_PAY' },
  { id: 'card', name: 'Card', icon: <CreditCard className="w-6 h-6" />, color: 'bg-purple-500', backendValue: 'CARD' },
  { id: 'delivery', name: 'Delivery', icon: <BikeIcon className="w-6 h-6" />, color: 'bg-orange-500', backendValue: 'CASH' },
];

export const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const location = useLocation();
  const { staff } = useAuthStore();

  const [order, setOrder] = useState<Order | null>(
    location.state?.order ? normalizeBackendOrder(location.state.order) : null
  );
  const [isLoading, setIsLoading] = useState(!location.state?.order && !!orderId);
  const [selectedMethod, setSelectedMethod] = useState('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [posId, setPosId] = useState('POS-1');

  // Load POS ID from settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await db.settings.get(1);
        if (settings?.posId) setPosId(settings.posId);
      } catch {
        // fallback to default
      }
    };
    loadSettings();
  }, []);

  // Fetch order if not in state
  useEffect(() => {
    if (!order && orderId) {
      fetch(`${API_URL}/orders/${orderId}`)
        .then(res => {
          if (!res.ok) throw new Error(`Order not found: ${res.status}`);
          return res.json();
        })
        .then(data => {
          setOrder(normalizeBackendOrder(data));
          setIsLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch order:', err);
          // Try Dexie fallback
          db.orders.get(orderId).then(localOrder => {
            if (localOrder) {
              setOrder(localOrder);
            }
            setIsLoading(false);
          });
        });
    }
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No order data found</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const total = Number(order.totalAmount) || 0;
  const subtotal = Number(order.totalAmount) / 1.08 || 0;
  const tax = Number(order.taxAmount) || 0;
  const change = cashReceived ? parseFloat(cashReceived) - total : 0;
  const isValidPayment =
    selectedMethod !== 'cash' ||
    (cashReceived && parseFloat(cashReceived) >= total);

  const handleQuickAmount = (amount: number) => {
    setCashReceived(amount.toFixed(2));
  };

  const handleExactAmount = () => {
    setCashReceived(total.toFixed(2));
  };

  const handlePayment = async () => {
    const selectedMethodData = paymentMethods.find(m => m.id === selectedMethod);
    if (!selectedMethodData) return;

    const effectiveOrderId = order.id || orderId;
    if (!effectiveOrderId) {
      alert('No order ID found');
      return;
    }

    try {
      // 1. Update order status to PAID
      const res = await fetch(`${API_URL}/orders/${effectiveOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PAID',
          paidAmount: total,
          paymentMethod: selectedMethodData.backendValue,
        }),
      });

      if (!res.ok) {
        const responseText = await res.text();
        throw new Error(`Failed: ${res.status} - ${responseText}`);
      }

      const updatedOrder = await res.json();

      // 2. Update table status to available
      if (order.tableId) {
        await fetch(`${API_URL}/tables/${order.tableId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'AVAILABLE' }),
        }).catch(err => console.error('Failed to update table status:', err));

        // Update local table
        updateLocalTableStatus(order.tableId, 'AVAILABLE');
        await db.diningTables.update(order.tableId, { status: 'AVAILABLE' });
      }

      // 3. Generate receipt
      const receipt = generateReceipt(
        updatedOrder,
        selectedMethodData.backendValue,
        total,
        staff?.id || 'unknown',
        posId
      );

      // 4. Save receipt to Dexie
      await db.receipts.put(receipt);
      printReceipt(receipt);

      // 5. Queue receipt for sync
      await syncQueue.enqueue('receipts', 'CREATE', receipt, receipt.id);

      // 6. Update order in Dexie
      await db.orders.update(effectiveOrderId, {
        status: 'PAID',
        paidAmount: total,
        paymentMethod: selectedMethodData.backendValue,
      });

      // 7. Queue order update for sync
      await syncQueue.enqueue('orders', 'UPDATE', {
        id: effectiveOrderId,
        status: 'PAID',
        paidAmount: total,
        paymentMethod: selectedMethodData.backendValue,
      }, effectiveOrderId);

    } catch (err) {
      console.error('❌ Payment failed:', err);

      // Offline fallback
      const receipt = generateReceipt(
        order,
        selectedMethodData.backendValue,
        total,
        staff?.id || 'unknown',
        posId
      );

      await db.receipts.put(receipt);
      printReceipt(receipt);
      await syncQueue.enqueue('receipts', 'CREATE', receipt, receipt.id);

      await db.orders.update(effectiveOrderId, {
        status: 'PAID',
        paidAmount: total,
        paymentMethod: selectedMethodData.backendValue,
      });
      await syncQueue.enqueue('orders', 'UPDATE', {
        id: effectiveOrderId,
        status: 'PAID',
        paidAmount: total,
        paymentMethod: selectedMethodData.backendValue,
      }, effectiveOrderId);

      if (order.tableId) {
        updateLocalTableStatus(order.tableId, 'AVAILABLE');
        await db.diningTables.update(order.tableId, { status: 'AVAILABLE' });
      }

      alert('Payment saved locally. Will sync when online.');
    }

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      navigate('/dashboard');
    }, 3000);
  };

  if (showSuccess) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-green-50">
        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <Check className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment Received!</h2>
        <p className="text-lg text-gray-600 mb-1">RM {total.toFixed(2)}</p>
        <p className="text-sm text-gray-500">Order #{orderId}</p>
        <p className="mt-6 text-xs text-gray-400">Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/pos')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="font-bold text-gray-900">Payment — Order #{orderId}</h1>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="space-y-2 mb-4">
              {(order.items || []).map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-700">{item.quantity}x {item.name}</span>
                  <span className="font-medium">RM{item.totalPrice.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">RM{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">SST (8%)</span>
                <span className="font-medium">RM{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total</span>
                <span className="text-primary-600">RM{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Payment Method</h3>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    selectedMethod === method.id
                      ? 'border-primary-500 bg-primary-50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-12 h-12 ${method.color} rounded-xl flex items-center justify-center text-white`}>
                    {method.icon}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{method.name}</span>
                </button>
              ))}
            </div>

            {selectedMethod === 'cash' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount Received</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">RM</span>
                    <input type="number" value={cashReceived} onChange={(e) => setCashReceived(e.target.value)} placeholder="0.00" className="w-full pl-12 pr-4 py-3 text-lg font-bold border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none" />
                  </div>
                </div>
                {cashReceived && (
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                    <span className="text-sm font-medium text-gray-700">Change</span>
                    <span className={`text-xl font-bold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      RM {change >= 0 ? change.toFixed(2) : '0.00'}
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-5 gap-2">
                  {['20', '30', '50', '100'].map((amount) => (
                    <button key={amount} onClick={() => handleQuickAmount(parseFloat(amount))} className="py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                      RM{amount}
                    </button>
                  ))}
                  <button onClick={handleExactAmount} className="py-2 bg-primary-100 text-primary-700 rounded-lg text-sm font-medium hover:bg-primary-200 transition-colors">Exact</button>
                </div>
              </div>
            )}
          </div>

          <button onClick={handlePayment} disabled={!isValidPayment} className="w-full py-4 bg-primary-600 text-white rounded-xl font-bold text-lg hover:bg-primary-700 active:bg-primary-800 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            <Check className="w-6 h-6" />
            Process Payment — RM{total.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
};
