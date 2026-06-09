// apps/pos/src/pages/PaymentPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Banknote, QrCode, CreditCard, Check, Split, MoreVertical,
} from 'lucide-react';
import type { POSOrder } from '../lib/types';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:4000';

// Local helpers (or import from types.ts)
function toFrontendOrderType(type: string): string {
  const map: Record<string, string> = {
    'DINE_IN': 'dine-in',
    'PICKUP': 'takeaway',
    'DELIVERY': 'delivery',
    'RESERVATION': 'reservation',
  };
  return map[type] || 'dine-in';
}

function toFrontendStatus(status: string): string {
  switch (status) {
    case 'PENDING': return 'active';
    case 'PAID': return 'completed';
    case 'CANCELLED': return 'cancelled';
    default: return 'active';
  }
}

interface PaymentMethodOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  backendValue: string;
}

const paymentMethods: PaymentMethodOption[] = [
  { id: 'cash', name: 'Cash', icon: <Banknote className="w-6 h-6" />, color: 'bg-green-500', backendValue: 'CASH' },
  { id: 'qr', name: 'QR Pay', icon: <QrCode className="w-6 h-6" />, color: 'bg-blue-500', backendValue: 'QR_PAY' },
  { id: 'card', name: 'Card', icon: <CreditCard className="w-6 h-6" />, color: 'bg-purple-500', backendValue: 'CARD' },
];

// Transform backend response → frontend format
const normalizeOrder = (data: any): POSOrder | null => {
  if (!data) return null;
  
  return {
    id: data.id,
    orderNumber: data.orderNumber || data.id?.slice(-4) || '',
    items: (data.items || []).map((i: any) => ({
      id: i.id || i.menuItemId || crypto.randomUUID?.() || Math.random().toString(36).slice(2),
      menuId: i.menuItemId || i.id || '',
      name: i.name || 'Unknown',
      price: Number(i.unitPrice) || Number(i.price) || 0,
      qty: Number(i.quantity) || Number(i.qty) || 0,
      modifiers: i.options || i.modifiers || [],
    })),
    type: toFrontendOrderType(data.type) as any,
    status: toFrontendStatus(data.status) as any,
    tableNumber: data.table?.number || data.tableNumber,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    customerInfo: data.customerName ? {
      name: data.customerName,
      phone: data.customerPhone || '',
    } : undefined,
    subtotal: Number(data.subtotal) || (Number(data.totalAmount) / 1.08) || 0,
    tax: Number(data.taxAmount) || Number(data.tax) || 0,
    total: Number(data.totalAmount) || Number(data.total) || 0,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
};

// ... rest of component (same as before)

export const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const location = useLocation();

  const [order, setOrder] = useState<any>(
    location.state?.order ? normalizeOrder(location.state.order) : null
  );
  const [isLoading, setIsLoading] = useState(!location.state?.order && !!orderId);
  const [selectedMethod, setSelectedMethod] = useState('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch order if not in state (page refresh)
  useEffect(() => {
    if (!order && orderId) {
      fetch(`${API_URL}/orders/${orderId}`)
        .then(res => {
          if (!res.ok) throw new Error(`Order not found: ${res.status}`);
          return res.json();
        })
        .then(data => {
          setOrder(normalizeOrder(data));
          setIsLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch order:', err);
          const localOrders = JSON.parse(localStorage.getItem('mat-pos-active-orders') || '[]');
          const localOrder = localOrders.find((o: any) => o.id === orderId);
          if (localOrder) {
            console.log('🔥 Found local order:', localOrder);
            setOrder(normalizeOrder(localOrder));
          }
          setIsLoading(false);
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

  const total = Number(order.total) || 0;
  const subtotal = Number(order.subtotal) || 0;
  const tax = Number(order.tax) || 0;
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

      // Update table status to available
      if (order.tableNumber) {
        await fetch(`${API_URL}/tables/${order.tableNumber}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'available' }),
        }).catch(err => console.error('Failed to update table status:', err));
      }

      // Save receipt
      const receipts = JSON.parse(localStorage.getItem('mat-pos-receipts') || '[]');
      receipts.push({
        id: effectiveOrderId,
        receiptNo: new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + String(receipts.length + 1).padStart(3, '0'),
        tableNumber: order.tableNumber || '-',
        orderType: order.type,
        time: new Date().toLocaleTimeString(),
        cashier: 'Ahmad',
        posId: 'POS-1',
        items: (order.items || []).map((i: any) => ({ 
          name: i.name || 'Unknown', 
          qty: i.qty || 0, 
          price: i.price || 0 
        })),
        total: total,
        paymentMethod: selectedMethodData.backendValue,
      });
      localStorage.setItem('mat-pos-receipts', JSON.stringify(receipts));

      // Remove from active orders
      const activeOrders = JSON.parse(localStorage.getItem('mat-pos-active-orders') || '[]');
      const updatedActive = activeOrders.filter((o: any) => o.id !== effectiveOrderId);
      localStorage.setItem('mat-pos-active-orders', JSON.stringify(updatedActive));

    } catch (err) {
      console.error('❌ Payment failed:', err);
      alert('Payment failed. Please try again.');
      return;
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
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200">
            <Split className="w-4 h-4" />
            <span className="text-sm font-medium">Split Bill</span>
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <MoreVertical className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full capitalize">
                  {order.type?.replace('-', ' ') || 'Unknown'}
                </span>
                <span className="ml-2 text-sm text-gray-500">
                  Table {order.tableNumber || '-'}
                </span>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              {(order.items || []).map((item: any) => {
                const qty = Number(item.qty) || 0;
                const price = Number(item.price) || 0;
                return (
                  <div key={item.id || Math.random().toString(36).slice(2)} className="flex justify-between text-sm">
                    <span className="text-gray-700">{qty}x {item.name || 'Unknown'}</span>
                    <span className="font-medium">RM{(qty * price).toFixed(2)}</span>
                  </div>
                );
              })}
              {(!order.items || order.items.length === 0) && (
                <p className="text-sm text-gray-400 italic">No items</p>
              )}
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

            {selectedMethod === 'qr' && (
              <div className="text-center py-8">
                <div className="w-48 h-48 bg-gray-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
                  <QrCode className="w-24 h-24 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600">Scan QR code to pay</p>
                <p className="text-xs text-gray-400 mt-1">DuitNow / GrabPay / TouchNGo</p>
              </div>
            )}

            {selectedMethod === 'card' && (
              <div className="text-center py-8">
                <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600">Insert or tap card</p>
                <p className="text-xs text-gray-400 mt-1">Terminal will process automatically</p>
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