import React from 'react';
import { TrendingUp, Flame } from 'lucide-react';
import { MenuItem } from '@mat-ai/types';

interface TrendingSectionProps {
  items: MenuItem[];
  onItemClick: (item: MenuItem) => void;
}

export const TrendingSection: React.FC<TrendingSectionProps> = ({ items, onItemClick }) => {
  if (items.length === 0) return null;

  return (
    <div className="px-4 py-6">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-5 h-5 text-orange-500" />
        <h2 className="text-lg font-bold text-gray-800">Trending Now</h2>
        <TrendingUp className="w-4 h-4 text-green-500" />
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onItemClick(item)}
            className="flex-shrink-0 w-36 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:scale-[1.02] transition-all text-left"
          >
            <div className="h-24 bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl">🍽️</span>
              )}
            </div>
            <div className="p-3">
              <p className="font-semibold text-sm text-gray-800 truncate">{item.name}</p>
              <p className="text-orange-600 font-bold text-sm">RM {item.price.toFixed(2)}</p>
              <div className="flex items-center gap-1 mt-1">
                <Flame className="w-3 h-3 text-red-500" />
                <span className="text-xs text-gray-500">Hot item</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
