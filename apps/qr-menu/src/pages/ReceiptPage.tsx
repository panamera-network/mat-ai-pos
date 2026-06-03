import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Home, Share2, Download, Printer } from 'lucide-react';
import type { Order } from '@mat-ai/types';

export const ReceiptPage: React.FC = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const orders = JSON.parse(localStorage.getItem('mat-pos-active-orders') || '[]');
    const found = orders.find((o: Order) => o.id === orderId);
    setOrder(found || null);
  }, [orderId]);

  const handleShare = async () => {
    if (!order) return;
    const text = `MAT.ai Order ${order.orderNumber || order.id}\nTotal: RM${order.total?.toFixed(2)}\nThank you!`;

    if (navigator.share) {
      await navigator.share({ title: 'MAT.ai Receipt', text });
    } else {
      await navigator.clipboard.writeText(text);
      alert('Receipt copied to clipboard!');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Receipt not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-sm mx-auto bg-white rounded-2xl shadow-lg p-6 print:shadow-none">
        {/* Header */}
        <div className="text-center border-b-2 border-dashed pb-4 mb-4">
          <h1 className="text-2xl font-bold text-gray-900">MAT.ai</h1>
          <p className="text-sm text-gray-500">Digital Receipt</p>
          <p className="text-xs text-gray-400 mt-1">
            {new Date(order.createdAt).toLocaleString('ms-MY', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </p>
        </div>

        {/* Order Info */}
        <div className="text-sm text-gray-600 mb-4 space-y-1">
          <div className="flex justify-between">
            <span>Order:</span>
            <span className="font-medium">#{order.orderNumber || order.id}</span>
          </div>
          <div className="flex justify-between">
            <span>Type:</span>
            <span className="capitalize">{order.orderType?.replace('-', ' ')}</span>
          </div>
          {order.tableNumber && (
            <div className="flex justify-between">
              <span>Table:</span>
              <span>{order.tableNumber}</span>
            </div>
          )}
          {order.customerName && (
            <div className="flex justify-between">
              <span>Customer:</span>
              <span>{order.customerName}</span>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="border-t-2 border-dashed pt-3 mb-4">
          <p className="text-xs font-bold text-gray-400 uppercase mb-2">Items</p>
          <div className="space-y-2">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <div>
                  <span className="font-medium">{item.qty}x</span>{' '}
                  <span>{item.name}</span>
                </div>
                <span className="font-medium">RM{(item.qty * item.price).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="border-t-2 border-dashed pt-3 space-y-1 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>RM{order.subtotal?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>SST (8%)</span>
            <span>RM{order.tax?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t-2 border-dashed">
            <span>Total</span>
            <span className="text-primary-600">RM{order.total?.toFixed(2)}</span>
          </div>
        </div>

        {/* Thank You */}
        <div className="text-center mt-6 pt-4 border-t-2 border-dashed">
          <p className="text-gray-500 text-sm">Thank you for dining with us!</p>
          <p className="text-xs text-gray-400 mt-1">Please come again</p>
          <p className="text-xs text-gray-400 mt-2">@mataipos</p>
        </div>
      </div>

      {/* Actions */}
      <div className="max-w-sm mx-auto mt-6 space-y-3 print:hidden">
        <button
          onClick={() => navigate('/')}
          className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium flex items-center justify-center gap-2"
        >
          <Home className="w-5 h-5" />
          Order Again
        </button>

        <div className="flex gap-3">
          <button 
            onClick={handleShare}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
          <button 
            onClick={handlePrint}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>
    </div>
  );
};
