import React from 'react';
import { Sparkles, ChevronDown } from 'lucide-react';

interface HeroSectionProps {
  outletName: string;
  tagline?: string;
  onScrollToMenu: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  outletName,
  tagline = 'Order. Eat. Repeat.',
  onScrollToMenu,
}) => {
  return (
    <div className="relative min-h-[60vh] flex flex-col items-center justify-center bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 text-white overflow-hidden">
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-yellow-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 text-center px-6">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="w-6 h-6 text-yellow-300" />
          <span className="text-sm font-medium tracking-wider uppercase text-yellow-200">
            Welcome to
          </span>
          <Sparkles className="w-6 h-6 text-yellow-300" />
        </div>

        <h1 className="text-4xl md:text-6xl font-bold mb-3 tracking-tight">
          {outletName}
        </h1>

        <p className="text-lg md:text-xl text-white/90 mb-8 font-light">
          {tagline}
        </p>

        <button
          onClick={onScrollToMenu}
          className="group bg-white text-orange-600 px-8 py-3 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
        >
          Browse Menu
          <ChevronDown className="inline-block ml-2 w-5 h-5 group-hover:translate-y-1 transition-transform" />
        </button>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="white"
          />
        </svg>
      </div>
    </div>
  );
};
