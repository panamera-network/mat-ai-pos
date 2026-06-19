import React, { useState, useEffect } from 'react';
import { X, Tag, Clock, Percent } from 'lucide-react';
import { Promotion } from '@mat-ai/types';

interface PromoBannerProps {
  promotions: Promotion[];
  onDismiss?: (id: string) => void;
}

export const PromoBanner: React.FC<PromoBannerProps> = ({ promotions, onDismiss }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visiblePromos = promotions.filter((p) => !dismissed.has(p.id) && p.type === 'BANNER');

  useEffect(() => {
    if (visiblePromos.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % visiblePromos.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [visiblePromos.length]);

  if (visiblePromos.length === 0) return null;

  const promo = visiblePromos[currentIndex];

  const handleDismiss = () => {
    setDismissed((prev) => new Set(prev).add(promo.id));
    if (onDismiss) onDismiss(promo.id);
  };

  const getIcon = () => {
    if (promo.discount) return <Percent className="w-5 h-5" />;
    if (promo.type === 'FREE_ITEM') return <Tag className="w-5 h-5" />;
    return <Clock className="w-5 h-5" />;
  };

  return (
    <div className="relative mx-4 -mt-6 z-20">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-4 shadow-lg text-white">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="bg-white/20 p-2 rounded-xl">
            {getIcon()}
          </div>
          <div className="flex-1 pr-6">
            <h3 className="font-bold text-sm">{promo.title}</h3>
            {promo.description && (
              <p className="text-xs text-white/80 mt-1">{promo.description}</p>
            )}
            {promo.discount && (
              <span className="inline-block mt-2 bg-white/20 px-2 py-0.5 rounded-full text-xs font-semibold">
                {promo.type === 'DISCOUNT_PERCENT' ? `${promo.discount}% OFF` : `RM ${promo.discount} OFF`}
              </span>
            )}
          </div>
        </div>

        {visiblePromos.length > 1 && (
          <div className="flex gap-1 mt-3 justify-center">
            {visiblePromos.map((_, idx) => (
              <div
                key={idx}
                className={`h-1 rounded-full transition-all duration-300 ${
                  idx === currentIndex ? 'w-6 bg-white' : 'w-2 bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
