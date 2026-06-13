import React from 'react';
import { cn } from '../lib/utils';
import { Clock, Users, Smartphone, ShoppingBag, Car, Calendar } from 'lucide-react';
import type { Order, OrderType, OrderStatus } from '@mat-ai/types';

export interface OrderCardProps extends React.HTMLAttributes<HTMLButtonElement> {
  order: Order; variant?: 'compact' | 'full'; showItems?: boolean;
}

const typeConfig: Record<OrderType, { icon: React.ReactNode; color: string; label: string }> = {
  DINE_IN: { icon: <Users className="w-4 h-4" />, color: 'border-blue-200 bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300', label: 'Dine In' },
  PICKUP: { icon: <ShoppingBag className="w-4 h-4" />, color: 'border-orange-200 bg-orange-50 text-orange-800 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-300', label: 'Takeaway' },
  DELIVERY: { icon: <Car className="w-4 h-4" />, color: 'border-purple-200 bg-purple-50 text-purple-800 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300', label: 'Delivery' },
  RESERVATION: { icon: <Calendar className="w-4 h-4" />, color: 'border-pink-200 bg-pink-50 text-pink-800 dark:bg-pink-900/20 dark:border-pink-800 dark:text-pink-300', label: 'Reservation' },
};

const statusConfig: Record<OrderStatus, { dot: string; label: string }> = {
  PENDING: { dot: 'bg-warning-500', label: 'Pending' },
  PAID: { dot: 'bg-success-500', label: 'Paid' },
  PREPARING: { dot: 'bg-primary-500', label: 'Preparing' },
  READY: { dot: 'bg-info-500', label: 'Ready' },
  SERVED: { dot: 'bg-success-500', label: 'Served' },
  CANCELLED: { dot: 'bg-gray-500', label: 'Cancelled' },
};

export const OrderCard = React.forwardRef<HTMLButtonElement, OrderCardProps>(
  ({ order, variant = 'compact', showItems = false, className, ...props }, ref) => {
    const type = typeConfig[order.type];
    const status = statusConfig[order.status];
    const isQr = order.source === 'QR_MENU';

    if (variant === 'compact') {
      return (
        <button ref={ref} className={cn('relative p-4 rounded-2xl border-2 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]', type.color, className)} {...props}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-lg">{order.orderNumber || order.id.slice(-4)}</span>
            <div className="flex items-center gap-1.5">{isQr && <Smartphone className="w-3.5 h-3.5 opacity-70" />}{type.icon}</div>
          </div>
          {order.customerInfo?.name && <p className="text-sm font-medium opacity-90 truncate">{order.customerInfo.name}</p>}
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm font-bold">RM{order.totalAmount.toFixed(2)}</span>
            <div className="flex items-center gap-1"><span className={cn('w-2 h-2 rounded-full', status.dot)} /><span className="text-2xs opacity-70">{status.label}</span></div>
          </div>
        </button>
      );
    }

    return (
      <button ref={ref} className={cn('w-full p-5 rounded-2xl border-2 text-left transition-all duration-200 hover:shadow-soft-lg active:scale-[0.99] bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800', className)} {...props}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-gray-900 dark:text-gray-100">{order.orderNumber}</span>
              <span className={cn('badge', type.color)}>{type.icon}{type.label}</span>
              {isQr && <span className="badge bg-info-100 text-info-800 dark:bg-info-900/30 dark:text-info-300"><Smartphone className="w-3 h-3" />QR</span>}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{order.customerInfo?.name || 'Guest'} · {order.items?.length || 0} items</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-primary-600 dark:text-primary-400">RM{order.totalAmount.toFixed(2)}</p>
            <div className="flex items-center gap-1 mt-1 justify-end"><span className={cn('w-2 h-2 rounded-full', status.dot)} /><span className="text-xs text-gray-500">{status.label}</span></div>
          </div>
        </div>
        {showItems && order.items && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="space-y-2">
              {order.items.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">{item.quantity}x {item.name}</span>
                  <span className="text-gray-500 dark:text-gray-400">RM{(item.quantity * item.unitPrice).toFixed(2)}</span>
                </div>
              ))}
              {order.items.length > 3 && <p className="text-xs text-gray-400">+{order.items.length - 3} more items</p>}
            </div>
          </div>
        )}
        <div className="flex items-center gap-1 mt-3 text-xs text-gray-400"><Clock className="w-3 h-3" />{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
      </button>
    );
  }
);
OrderCard.displayName = 'OrderCard';