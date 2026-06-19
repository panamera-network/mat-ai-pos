import React from 'react';
import { Star, Crown } from 'lucide-react';
import { Customer } from '@mat-ai/types';

interface LoyaltyBadgeProps {
  customer: Customer;
  onClick?: () => void;
}

export const LoyaltyBadge: React.FC<LoyaltyBadgeProps> = ({ customer, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-2 rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all"
    >
      {customer.isVip ? (
        <Crown className="w-4 h-4" />
      ) : (
        <Star className="w-4 h-4" />
      )}
      <span className="text-sm font-semibold">
        {customer.points} pts
      </span>
      {customer.isVip && (
        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">VIP</span>
      )}
    </button>
  );
};
