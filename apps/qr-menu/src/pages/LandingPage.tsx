// apps/qr-menu/src/pages/LandingPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Sparkles, ArrowRight, Star, Gift, X,
  UtensilsCrossed, ShoppingBag, Truck, CalendarCheck,
  User, Phone, Table, Users, Clock, MapPin,
  Heart,
  Zap,
  Crown,
  Percent,
  Tag
} from 'lucide-react';
import { useCustomerContext } from '../context/CustomerContext';
import { usePromotions } from '../hooks/usePromotions';
import { CustomerModal } from '../components/CustomerModal';
import { PromoBanner } from '../components/PromoBanner';
import { LoyaltyBadge } from '../components/LoyaltyBadge';
import type { OrderType, LandingPagePublicData } from '@mat-ai/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const OUTLET_NAME = import.meta.env.VITE_OUTLET_NAME || 'MAT.ai Kitchen';
const OUTLET_ID = import.meta.env.VITE_OUTLET_ID || 'default-outlet';

interface TableData {
  id: string;
  number: string;
  name?: string;
  capacity: number;
}

interface OrderTypeOption {
  id: OrderType;
  label: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
}

const orderTypes: OrderTypeOption[] = [
  {
    id: 'DINE_IN',
    label: 'Dine In',
    description: 'Order and eat at the restaurant',
    icon: <UtensilsCrossed className="w-6 h-6" />,
    gradient: 'from-orange-500 to-red-500',
  },
  {
    id: 'PICKUP',
    label: 'Pickup',
    description: 'Order now, pick up at counter',
    icon: <ShoppingBag className="w-6 h-6" />,
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    id: 'DELIVERY',
    label: 'Delivery',
    description: 'We deliver to your address',
    icon: <Truck className="w-6 h-6" />,
    gradient: 'from-red-500 to-pink-500',
  },
  {
    id: 'RESERVATION',
    label: 'Reservation',
    description: 'Book a table for later',
    icon: <CalendarCheck className="w-6 h-6" />,
    gradient: 'from-pink-500 to-purple-500',
  },
];

// Icon mapping for dynamic features
const iconMap: Record<string, React.ReactNode> = {
  Gift: <Gift className="w-5 h-5" />,
  Sparkles: <Sparkles className="w-5 h-5" />,
  Star: <Star className="w-5 h-5" />,
  Heart: <Heart className="w-5 h-5" />,
  Zap: <Zap className="w-5 h-5" />,
  Crown: <Crown className="w-5 h-5" />,
  Truck: <Truck className="w-5 h-5" />,
  Clock: <Clock className="w-5 h-5" />,
  Percent: <Percent className="w-5 h-5" />,
  Tag: <Tag className="w-5 h-5" />,
  ShoppingBag: <ShoppingBag className="w-5 h-5" />,
  UtensilsCrossed: <UtensilsCrossed className="w-5 h-5" />,
};

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { customer, initFromStorage, createCustomer } = useCustomerContext();
  const { promotions } = usePromotions();

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedType, setSelectedType] = useState<OrderType | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [tables, setTables] = useState<TableData[]>([]);

  // CMS data
  const [cmsData, setCmsData] = useState<LandingPagePublicData | null>(null);
  const [, setCmsLoading] = useState(true);

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [selectedTable, setSelectedTable] = useState('');
  const [pax, setPax] = useState(1);
  const [reservationTime, setReservationTime] = useState('');
  const [formError, setFormError] = useState('');

  const tableFromQR = searchParams.get('table');
  const bottomSheetRef = useRef<HTMLDivElement>(null);

  // Fetch CMS data
  useEffect(() => {
    fetch(`${API_URL}/landing-page/public?outletId=${OUTLET_ID}`)
      .then(res => res.json())
      .then(data => { setCmsData(data); setCmsLoading(false); })
      .catch(err => { console.error('Failed to load CMS:', err); setCmsLoading(false); });
  }, []);

  // Init customer from storage
  useEffect(() => {
    const hasStored = initFromStorage();
    if (!hasStored) {
      const timer = setTimeout(() => setShowCustomerModal(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [initFromStorage]);

  // Pre-fill from customer
  useEffect(() => {
    if (customer) {
      setCustomerName(customer.name);
      setCustomerPhone(customer.phone);
    }
  }, [customer]);

  // Handle bottom sheet drag
  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const handleMove = (moveEvent: TouchEvent | MouseEvent) => {
      const currentY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : (moveEvent as MouseEvent).clientY;
      if (currentY - startY > 100) {
        setShowBottomSheet(false);
      }
    };
    const handleEnd = () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleEnd);
  };

  const handleSelectType = (type: OrderType) => {
    setSelectedType(type);
    setFormError('');

    if (type === 'DINE_IN' || type === 'RESERVATION') {
      fetch(`${API_URL}/tables`)
        .then(res => res.json())
        .then(data => {
          setTables(data);
          if (type === 'DINE_IN' && tableFromQR) {
            const matched = data.find((t: TableData) => t.number === tableFromQR || t.id === tableFromQR);
            if (matched) setSelectedTable(matched.id);
          }
        })
        .catch(err => console.error('Failed to load tables:', err));
    }

    setShowBottomSheet(false);
    setShowForm(true);
  };

  const validateForm = (): boolean => {
    if (!customerName || !customerPhone) {
      setFormError('Please fill in Name and Phone');
      return false;
    }
    if ((selectedType === 'DINE_IN' || selectedType === 'RESERVATION') && !selectedTable) {
      setFormError('Please select a table');
      return false;
    }
    if (selectedType === 'DELIVERY' && !customerAddress) {
      setFormError('Please enter delivery address');
      return false;
    }
    if (selectedType === 'RESERVATION' && !reservationTime) {
      setFormError('Please select reservation time');
      return false;
    }
    return true;
  };

  const handleContinue = () => {
    if (!validateForm()) return;

    localStorage.setItem('mat-qr-order-type', selectedType!);
    localStorage.setItem('mat-qr-customer-name', customerName);
    localStorage.setItem('mat-qr-customer-phone', customerPhone);
    if (customerAddress) localStorage.setItem('mat-qr-customer-address', customerAddress);
    if (selectedTable) localStorage.setItem('mat-qr-table-id', selectedTable);
    localStorage.setItem('mat-qr-pax', String(pax));
    if (reservationTime) localStorage.setItem('mat-qr-reservation-time', reservationTime);

    navigate('/menu');
  };

  const handleCustomerSubmit = async (data: { name: string; phone: string }) => {
    try {
      await createCustomer({ name: data.name, phone: data.phone });
      setShowCustomerModal(false);
    } catch {
      // Error handled in context
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setSelectedType(null);
    setFormError('');
  };

  const needsTable = selectedType === 'DINE_IN' || selectedType === 'RESERVATION';
  const needsAddress = selectedType === 'DELIVERY';
  const isReservation = selectedType === 'RESERVATION';

  // Get hero content from CMS or fallback
  const heroContent = cmsData?.hero?.[0]?.content || {
    title: OUTLET_NAME,
    tagline: 'Order. Eat. Earn Rewards.',
    subtitle: 'Welcome to',
    ctaText: 'Start Order',
    gradient: 'from-orange-500 via-red-500 to-pink-600',
  };

  // Get features from CMS or fallback
  const features = cmsData?.features || [
    { key: 'earn_points', content: { icon: 'Gift', title: 'Earn Points', description: '1pt / RM1' }, sortOrder: 0 },
    { key: 'exclusive_deals', content: { icon: 'Sparkles', title: 'Exclusive Deals', description: 'Members only' }, sortOrder: 1 },
    { key: 'vip_rewards', content: { icon: 'Star', title: 'VIP Rewards', description: 'Special perks' }, sortOrder: 2 },
  ];

  // Get footer content from CMS or fallback
  const footerContent = cmsData?.footer?.[0]?.content || {
    text: 'Powered by MAT.ai',
    showLogo: true,
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="font-bold text-lg text-gray-800">{OUTLET_NAME}</h1>
          {customer && (
            <LoyaltyBadge customer={customer} onClick={() => setShowCustomerModal(true)} />
          )}
        </div>
      </header>

      {/* Hero Section */}
      <div className="pt-14">
        <div className={`relative min-h-[45vh] flex flex-col items-center justify-center bg-gradient-to-br ${heroContent.gradient} text-white overflow-hidden`}>
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-yellow-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
          </div>

          <div className="relative z-10 text-center px-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-yellow-300" />
              <span className="text-sm font-medium tracking-wider uppercase text-yellow-200">
                {heroContent.subtitle}
              </span>
              <Sparkles className="w-6 h-6 text-yellow-300" />
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight">
              {heroContent.title}
            </h1>

            <p className="text-lg text-white/90 mb-6 font-light">
              {heroContent.tagline}
            </p>

            {/* Big CTA Button - Mobile First */}
            <button
              onClick={() => setShowBottomSheet(true)}
              className="group bg-white text-orange-600 px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2 mx-auto"
            >
              {heroContent.ctaText || 'Start Order'}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            {customer ? (
              <div className="flex items-center justify-center gap-2 text-sm text-white/80 mt-4">
                <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                {customer.points} points • {customer.visits} visits
              </div>
            ) : (
              <button
                onClick={() => setShowCustomerModal(true)}
                className="text-sm text-white/80 hover:text-white underline underline-offset-2 transition-colors mt-4"
              >
                Join & earn 1 point per RM 1 spent
              </button>
            )}
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
      </div>

      {/* Promo Banner */}
      <PromoBanner promotions={promotions} />

      {/* Features Section */}
      <div className="px-4 py-6 max-w-lg mx-auto">
        <div className="grid grid-cols-3 gap-3">
          {features.map((feature) => (
            <div key={feature.key} className="bg-white p-4 rounded-xl border border-gray-100 text-center">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2 text-orange-500">
                {iconMap[feature.content.icon] || <Star className="w-5 h-5" />}
              </div>
              <p className="text-xs font-semibold text-gray-700">{feature.content.title}</p>
              <p className="text-xs text-gray-400 mt-1">{feature.content.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Footer */}
      <div className="px-4 py-4 text-center">
        {footerContent.showLogo && (
          <Sparkles className="w-5 h-5 mx-auto mb-1 text-orange-400" />
        )}
        <p className="text-xs text-gray-400">{footerContent.text}</p>
      </div>

      {/* Customer Modal */}
      <CustomerModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onSubmit={handleCustomerSubmit}
        existingCustomer={customer}
        onSkip={() => setShowCustomerModal(false)}
      />

      {/* Bottom Sheet - Order Type Selection */}
      {showBottomSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowBottomSheet(false)} />
          <div
            ref={bottomSheetRef}
            className="relative bg-white rounded-t-3xl w-full max-w-lg animate-in slide-in-from-bottom duration-300"
            onTouchStart={handleDragStart}
            onMouseDown={handleDragStart}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>

            <div className="px-6 pb-8">
              <h2 className="text-lg font-bold text-gray-800 text-center mb-6">
                How would you like to order?
              </h2>

              <div className="grid grid-cols-2 gap-3">
                {orderTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleSelectType(type.id)}
                    className="p-4 rounded-2xl border-2 border-gray-200 bg-white text-left transition-all active:scale-[0.98] hover:border-orange-300 hover:shadow-md"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${type.gradient} flex items-center justify-center text-white mb-3`}>
                      {type.icon}
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">{type.label}</h3>
                    <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowBottomSheet(false)}
                className="w-full mt-4 py-3 text-gray-500 text-sm font-medium hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Form Modal */}
      {showForm && selectedType && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-black/60" onClick={closeForm} />
          <div className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 max-h-[85vh] overflow-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${
                  orderTypes.find(t => t.id === selectedType)?.gradient
                } flex items-center justify-center text-white`}>
                  {orderTypes.find(t => t.id === selectedType)?.icon}
                </div>
                <h2 className="text-xl font-bold">
                  {orderTypes.find(t => t.id === selectedType)?.label}
                </h2>
              </div>
              <button onClick={closeForm} className="p-2 -mr-2">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Error */}
            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {formError}
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-3 mb-6">
              {/* Name */}
              <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border">
                <User className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Your Name *"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm"
                />
              </div>

              {/* Phone */}
              <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border">
                <Phone className="w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  placeholder="Phone Number *"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm"
                />
              </div>

              {/* Table Selection */}
              {needsTable && (
                <>
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border">
                    <Table className="w-5 h-5 text-gray-400" />
                    <select
                      value={selectedTable}
                      onChange={(e) => setSelectedTable(e.target.value)}
                      className="flex-1 bg-transparent outline-none text-sm"
                    >
                      <option value="">Select Table *</option>
                      {tables.map(table => (
                        <option key={table.id} value={table.id}>
                          {table.number}{table.name ? ` - ${table.name}` : ''} (Capacity: {table.capacity})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border">
                    <Users className="w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      min={1}
                      placeholder="Number of Pax"
                      value={pax}
                      onChange={(e) => setPax(Number(e.target.value))}
                      className="flex-1 bg-transparent outline-none text-sm"
                    />
                  </div>
                </>
              )}

              {/* Reservation Time */}
              {isReservation && (
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <input
                    type="datetime-local"
                    value={reservationTime}
                    onChange={(e) => setReservationTime(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-sm"
                  />
                </div>
              )}

              {/* Delivery Address */}
              {needsAddress && (
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Delivery Address *"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-sm"
                  />
                </div>
              )}
            </div>

            {/* Continue Button */}
            <button
              onClick={handleContinue}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              Continue to Menu
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
