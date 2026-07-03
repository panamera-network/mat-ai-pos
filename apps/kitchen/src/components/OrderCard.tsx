// apps/kitchen/src/components/OrderCard.tsx
import React from 'react';
import { CheckCircle, UtensilsCrossed, Package, Bike, Calendar } from 'lucide-react';
import { Card, Badge, Button } from '@mat-ai/ui';
import type { KitchenTicket } from '../types/kitchen';
import { getTimerState, TIMER_COLORS } from '../utils/timer';
import { TimerBadge } from './TimerBadge';
import { OrderItemComponent } from './OrderItem';

interface OrderCardProps {
  ticket: KitchenTicket;
  onToggleItem: (orderId: string, itemId: string) => void;
  onDone: (orderId: string) => void;
}

const ORDER_TYPE_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  'dine-in': { icon: <UtensilsCrossed className="w-3 h-3" />, label: 'Dine In', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  'takeaway': { icon: <Package className="w-3 h-3" />, label: 'Takeaway', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
  'delivery': { icon: <Bike className="w-3 h-3" />, label: 'Delivery', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  'reservation': { icon: <Calendar className="w-3 h-3" />, label: 'Reservation', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300' },
};

export const OrderCard: React.FC<OrderCardProps> = ({ ticket, onToggleItem, onDone }) => {
  const timer = getTimerState(ticket.orderedAt);
  const colors = TIMER_COLORS[timer.color];
  const typeConfig = ORDER_TYPE_CONFIG[ticket.orderType] || ORDER_TYPE_CONFIG['dine-in'];

  const handleDone = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (ticket.allDone) {
      onDone(ticket.orderId);
    }
  };

  return (
    <Card variant="default" padding="none" className="h-full flex flex-col overflow-hidden">
      {/* Header with timer color */}
      <div className={`px-4 py-3 ${colors.bg} border-b ${colors.border}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">
                {ticket.tableNumber ? `Table ${ticket.tableNumber}` : `#${ticket.orderNumber}`}
              </h3>
              <TimerBadge orderedAt={ticket.orderedAt} />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              {new Date(ticket.orderedAt).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}
              {ticket.customerName && ` • ${ticket.customerName}`}
            </p>
          </div>
          <Button
            variant="success"
            size="sm"
            onClick={handleDone}
            disabled={!ticket.allDone}
            leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
            className="flex-shrink-0"
          >
            Done
          </Button>
        </div>
      </div>

      {/* Order Type Badge */}
      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
        <Badge variant="default" size="sm" className={typeConfig.color}>
          {typeConfig.icon}
          <span className="ml-1">{typeConfig.label}</span>
        </Badge>
      </div>

      {/* Items */}
      <div className="flex-1 p-3 space-y-1.5 overflow-y-auto min-h-0">
        {ticket.items.map((item) => (
          <OrderItemComponent
            key={item.id}
            item={item}
            onToggle={() => onToggleItem(ticket.orderId, item.id)}
          />
        ))}
      </div>
    </Card>
  );
};
