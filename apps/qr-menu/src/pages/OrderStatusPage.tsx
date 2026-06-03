import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, ChefHat, Package, Home, Wifi, WifiOff } from 'lucide-react';
import { initSync } from '../lib/sync';
import type { Order } from '@mat-ai/types';

type CombinedStatus = 'pending' | 'preparing' | 'ready' | 'served';

export const OrderStatusPage: React.FC = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [currentStatus, setCurrentStatus] = useState<CombinedStatus>('pending');
  const [wsConnected, setWsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    // Load order from localStorage first
    const orders = JSON.parse(localStorage.getItem('mat-pos-active-orders') || '[]');
    const found = orders.find((o: Order) => o.id === orderId);
    if (found) {
      setOrder(found);
      syncStatus(found);
    }

    // Init WS for real-time updates
    const cleanup = initSync();

    // Poll for updates every 5 seconds (fallback)
    const interval = setInterval(() => {
      const updated = JSON.parse(localStorage.getItem('mat-pos-active-orders') || '[]');
      const latest = updated.find((o: Order) => o.id === orderId);
      if (latest && JSON.stringify(latest) !== JSON.stringify(order)) {
        setOrder(latest);
        syncStatus(latest);
        setLastUpdated(new Date());
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      cleanup();
    };
  }, [orderId]);

  const syncStatus = (o: Order) => {
    if (o.status === 'served' || o.kitchenStatus === 'served') {
      setCurrentStatus('served');
    } else if (o.status === 'ready' || o.kitchenStatus === 'done') {
      setCurrentStatus('ready');
    } else if (o.status === 'preparing' || o.kitchenStatus === 'preparing') {
      setCurrentStatus('preparing');
    } else {
      setCurrentStatus('pending');
    }
  };

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

  const steps = [
    { status: 'pending' as CombinedStatus, label: 'Order Sent', icon: CheckCircle },
    { status: 'preparing' as CombinedStatus, label: 'Preparing', icon: ChefHat },
    { status: 'ready' as CombinedStatus, label: 'Ready', icon: Package },
    { status: 'served' as CombinedStatus, label: 'Served', icon: CheckCircle },
  ];

  const currentStepIndex = steps.findIndex(s => s.status === currentStatus);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Order Status</h1>
          <p className="text-gray-500 mt-1">#{order.orderNumber || order.id}</p>

          {/* Connection status */}
          <div className="flex items-center justify-center gap-1 mt-2">
            {wsConnected ? (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <Wifi className="w-3 h-3" /> Live updates
              </span>
            ) : (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <WifiOff className="w-3 h-3" /> Checking every 5s
              </span>
            )}
          </div>
        </div>

        {/* Progress Steps */}
        <div className="relative mb-8">
          {/* Line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200">
            <div
              className="h-full bg-primary-600 transition-all duration-700"
              style={{
                width: currentStepIndex >= 0 
                  ? `${(currentStepIndex / (steps.length - 1)) * 100}%` 
                  : '0%',
              }}
            />
          </div>

          {/* Steps */}
          <div className="relative flex justify-between">
            {steps.map((step, index) => {
              const isActive = step.status === currentStatus;
              const isDone = index < currentStepIndex;
              const Icon = step.icon;

              return (
                <div key={step.status} className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-500 ${
                      isActive
                        ? 'bg-primary-600 text-white scale-110 ring-4 ring-primary-100'
                        : isDone
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-xs mt-2 font-medium ${
                      isActive ? 'text-primary-600' : isDone ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Status Banner */}
        <div className={`rounded-2xl p-4 mb-6 text-center ${
          currentStatus === 'pending' ? 'bg-yellow-50 border border-yellow-200' :
          currentStatus === 'preparing' ? 'bg-blue-50 border border-blue-200' :
          currentStatus === 'ready' ? 'bg-green-50 border border-green-200' :
          'bg-gray-50 border border-gray-200'
        }`}>
          <p className={`font-semibold ${
            currentStatus === 'pending' ? 'text-yellow-800' :
            currentStatus === 'preparing' ? 'text-blue-800' :
            currentStatus === 'ready' ? 'text-green-800' :
            'text-gray-800'
          }`}>
            {currentStatus === 'pending' && 'Waiting for cashier confirmation...'}
            {currentStatus === 'preparing' && 'Your order is being prepared!'}
            {currentStatus === 'ready' && 'Your order is ready for pickup!'}
            {currentStatus === 'served' && 'Enjoy your meal!'}
          </p>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl border p-4 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Order Summary</h2>
          <div className="space-y-2">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {item.qty}x {item.name}
                </span>
                <span className="font-medium">RM{(item.qty * item.price).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t mt-3 pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>RM{order.subtotal?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>SST (8%)</span>
              <span>RM{order.tax?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-1 border-t">
              <span>Total</span>
              <span className="text-primary-600">RM{order.total?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Order Info */}
        <div className="bg-white rounded-2xl border p-4 mb-6 text-sm">
          <h2 className="font-semibold text-gray-900 mb-2">Order Info</h2>
          <div className="space-y-1 text-gray-600">
            <p><span className="font-medium">Type:</span> {order.orderType?.replace('-', ' ')}</p>
            {order.tableNumber && <p><span className="font-medium">Table:</span> {order.tableNumber}</p>}
            {order.customerName && <p><span className="font-medium">Name:</span> {order.customerName}</p>}
            {order.reservationTime && (
              <p><span className="font-medium">Time:</span> {new Date(order.reservationTime).toLocaleString()}</p>
            )}
            {order.notes && <p><span className="font-medium">Notes:</span> {order.notes}</p>}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Order Again
          </button>

          {currentStatus === 'served' && (
            <button
              onClick={() => navigate(`/receipt/${orderId}`)}
              className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium"
            >
              View Receipt
            </button>
          )}
        </div>

        {/* Last updated */}
        <p className="text-center text-xs text-gray-400 mt-6 flex items-center justify-center gap-1">
          <Clock className="w-3 h-3" />
          Updated {lastUpdated.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};
