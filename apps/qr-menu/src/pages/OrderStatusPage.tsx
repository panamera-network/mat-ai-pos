// apps/qr-menu/src/pages/OrderStatusPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Home, Clock } from 'lucide-react';
import type { OrderView, Order } from '@mat-ai/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Bulletproof money formatter
function formatMoney(value: any): string {
  const num = Number(value ?? 0);
  if (Number.isNaN(num)) return '0.00';
  return num.toFixed(2);
}

function prismaOrderToView(o: Order): OrderView {
  const totalAmount = Number(o.totalAmount ?? 0);
  const taxAmount = Number(o.taxAmount ?? 0);
  return {
    ...o,
    totalAmount,
    paidAmount: o.paidAmount ? Number(o.paidAmount) : undefined,
    taxAmount,
    subtotal: totalAmount,
    tax: taxAmount,
    finalTotal: totalAmount + taxAmount,
    tableNumber: (o as any).table?.number,
    items: (o.items || []).map((item: any) => ({
      ...item,
      quantity: Number(item.quantity ?? 1),
      unitPrice: Number(item.unitPrice ?? 0),
      totalPrice: Number(item.totalPrice ?? 0),
    })),
  };
}

export const OrderStatusPage: React.FC = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderView | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      setLoading(true);

      // Try localStorage first
      const orders = JSON.parse(localStorage.getItem('mat-pos-active-orders') || '[]');
      const found = orders.find((o: OrderView) => o.id === orderId);

      if (found) {
        setOrder(found);
        setLoading(false);
      } else {
        // Fallback fetch from API
        try {
          const res = await fetch(`${API_URL}/orders/${orderId}`);
          if (res.ok) {
            const data: Order = await res.json();
            const orderView = prismaOrderToView(data);
            setOrder(orderView);

            const existing = JSON.parse(localStorage.getItem('mat-pos-active-orders') || '[]');
            existing.push(orderView);
            localStorage.setItem('mat-pos-active-orders', JSON.stringify(existing));
          }
        } catch (err) {
          console.error('Failed to fetch order:', err);
        } finally {
          setLoading(false);
        }
      }
    };

    loadOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-gray-500">Order not found</p>
          <button onClick={() => navigate('/')} className="mt-4 text-primary-600 font-medium">
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Order Sent!</h1>
          <p className="text-gray-500 mt-1">#{order.orderNumber || order.id}</p>
          <p className="text-sm text-gray-400 mt-2">
            <Clock className="w-3 h-3 inline mr-1" />
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        {/* Status Banner */}
        <div className="rounded-2xl p-4 mb-6 text-center bg-yellow-50 border border-yellow-200">
          <p className="font-semibold text-yellow-800">
            Waiting for cashier confirmation...
          </p>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl border p-4 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Order Summary</h2>
          <div className="space-y-2">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {item.quantity}x {item.name}
                </span>
                <span className="font-medium">RM{formatMoney(Number(item.quantity) * Number(item.unitPrice))}</span>
              </div>
            ))}
          </div>
          <div className="border-t mt-3 pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>RM{formatMoney(order.subtotal)}</span>
            </div>
            {Number(order.tax) > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>RM{formatMoney(order.tax)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-1 border-t">
              <span>Total</span>
              <span className="text-primary-600">RM{formatMoney(order.finalTotal ?? order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Order Info */}
        <div className="bg-white rounded-2xl border p-4 mb-6 text-sm">
          <h2 className="font-semibold text-gray-900 mb-2">Order Info</h2>
          <div className="space-y-1 text-gray-600">
            <p><span className="font-medium">Type:</span> {order.type?.replace('_', ' ')}</p>
            {order.tableNumber && <p><span className="font-medium">Table:</span> {order.tableNumber}</p>}
            {order.customerName && <p><span className="font-medium">Name:</span> {order.customerName}</p>}
            {order.customerPhone && <p><span className="font-medium">Phone:</span> {order.customerPhone}</p>}
            {order.reservationTime && (
              <p><span className="font-medium">Reservation:</span> {new Date(order.reservationTime).toLocaleString()}</p>
            )}
            {order.notes && <p><span className="font-medium">Notes:</span> {order.notes}</p>}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Order Again
          </button>
        </div>
      </div>
    </div>
  );
};