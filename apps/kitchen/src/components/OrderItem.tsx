// apps/kitchen/src/components/OrderItem.tsx
import React from 'react';
import { Check } from 'lucide-react';
import type { KitchenTicketItem } from '../types/kitchen';

interface OrderItemProps {
  item: KitchenTicketItem;
  onToggle: () => void;
}

export const OrderItemComponent: React.FC<OrderItemProps> = ({ item, onToggle }) => {
  return (
    <div
      onClick={onToggle}
      className={`
        flex items-start gap-3 py-2.5 px-3 rounded-xl cursor-pointer transition-all duration-200
        border ${item.done ? 'bg-emerald-50/80 border-emerald-200 opacity-60' : 'bg-white border-gray-100 hover:border-primary-300 hover:shadow-sm'}
      `}
    >
      {/* Checkbox */}
      <div
        className={`
          w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all
          ${item.done ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}
        `}
      >
        {item.done && <Check className="w-3.5 h-3.5 text-white" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold leading-snug ${item.done ? 'text-emerald-800 line-through' : 'text-gray-900'}`}>
          {item.quantity} x {item.name}
        </p>
        {item.options && item.options.length > 0 && (
          <p className="text-xs text-gray-500 mt-0.5">
            {item.options.map((opt) => opt.name).join(', ')}
          </p>
        )}
        {item.notes && (
          <p className="text-xs text-amber-600 font-medium mt-0.5">
            {item.notes}
          </p>
        )}
      </div>
    </div>
  );
};