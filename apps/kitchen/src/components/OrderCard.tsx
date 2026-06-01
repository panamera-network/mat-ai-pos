// apps/kitchen/src/components/OrderCard.tsx
import React from 'react';
import { CheckCircle, UtensilsCrossed, Package, Bike } from 'lucide-react';
import type { KitchenTicket } from '../types/kitchen';
import { getTimerState, TIMER_COLORS } from '../utils/timer';
import { TimerBadge } from './TimerBadge';
import { OrderItemComponent } from './OrderItem';

interface OrderCardProps {
  ticket: KitchenTicket;
  onToggleItem: (orderId: string, itemIndex: number) => void;
  onDone: (orderId: string) => void;
}

const ORDER_TYPE_ICONS = {
  'dine-in': <UtensilsCrossed className="w-3 h-3" />,
  'takeaway': <Package className="w-3 h-3" />,
  'delivery': <Bike className="w-3 h-3" />,
};

const ORDER_TYPE_LABELS: Record<string, string> = {
  'dine-in': 'Dine In',
  'takeaway': 'Takeaway',
  'delivery': 'Delivery',
};

export const OrderCard: React.FC<OrderCardProps> = ({ ticket, onToggleItem, onDone }) => {
  const timer = getTimerState(ticket.orderedAt);
  const colors = TIMER_COLORS[timer.color];

  const handleDone = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDone(ticket.orderId);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full w-full">
      {/* Header */}
      <div className={`px-3 py-2.5 ${colors.bg} border-b ${colors.border} flex-shrink-0`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="text-base font-bold text-gray-900 truncate">
                {ticket.tableNumber ? `Table ${ticket.tableNumber}` : `#${ticket.orderId.slice(-6)}`}
              </h3>
              <TimerBadge orderedAt={ticket.orderedAt} />
            </div>
            <p className="text-[11px] text-gray-600 mt-0.5">
              {new Date(ticket.orderedAt).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}
              {ticket.customerName && ` • ${ticket.customerName}`}
            </p>
          </div>
          <button
            onClick={handleDone}
            disabled={!ticket.allDone}
            className={`
              flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex-shrink-0
              ${ticket.allDone
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Done
          </button>
        </div>
      </div>

      {/* Order Type Badge */}
      <div className="px-3 py-1.5 border-b border-gray-100 flex-shrink-0">
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[11px] font-medium">
          {ORDER_TYPE_ICONS[ticket.orderType] || ORDER_TYPE_ICONS['dine-in']}
          {ORDER_TYPE_LABELS[ticket.orderType] || ticket.orderType}
        </div>
      </div>

      {/* Items - flex-1 to fill remaining space */}
      <div className="flex-1 p-2 space-y-1 overflow-y-auto min-h-0">
        {ticket.items.map((item, idx) => (
          <OrderItemComponent
            key={`${ticket.orderId}-${idx}`}
            item={item}
            index={idx}
            onToggle={(i) => onToggleItem(ticket.orderId, i)}
          />
        ))}
      </div>
    </div>
  );
};
