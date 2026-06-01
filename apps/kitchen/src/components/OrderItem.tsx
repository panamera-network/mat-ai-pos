// apps/kitchen/src/components/OrderItem.tsx
import React from 'react';
import { Check } from 'lucide-react';
import type { KitchenTicketItem } from '../types/kitchen';

interface OrderItemProps {
  item: KitchenTicketItem;
  index: number;
  onToggle: (index: number) => void;
}

export const OrderItemComponent: React.FC<OrderItemProps> = ({ item, index, onToggle }) => {
  return (
    <div
      onClick={() => onToggle(index)}
      className={`
        flex items-start gap-2.5 py-2 px-3 rounded-lg cursor-pointer transition-all
        border ${item.done ? 'bg-emerald-50 border-emerald-200 opacity-60' : 'bg-white border-gray-100 hover:border-primary-200'}
      `}
    >
      {/* Checkbox */}
      <div
        className={`
          w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5
          ${item.done ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}
        `}
      >
        {item.done && <Check className="w-3.5 h-3.5 text-white" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 leading-snug">
          {item.qty} x {item.name}
        </p>
        {item.modifiers.length > 0 && (
          <p className="text-xs text-gray-500 mt-0.5">
            {item.modifiers.map((m) => m.name).join(', ')}
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
