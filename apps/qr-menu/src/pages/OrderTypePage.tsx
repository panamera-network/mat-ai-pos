import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UtensilsCrossed, ShoppingBag, Truck, CalendarCheck, ChevronRight } from 'lucide-react';

export type OrderType = 'dine-in' | 'pickup' | 'delivery' | 'reservation';

interface OrderTypeOption {
  id: OrderType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const orderTypes: OrderTypeOption[] = [
  {
    id: 'dine-in',
    label: 'Dine In',
    description: 'Order and eat at the restaurant',
    icon: <UtensilsCrossed className="w-6 h-6" />,
    color: 'bg-blue-50 text-blue-600 border-blue-200',
  },
  {
    id: 'pickup',
    label: 'Pickup',
    description: 'Order now, pick up at counter',
    icon: <ShoppingBag className="w-6 h-6" />,
    color: 'bg-green-50 text-green-600 border-green-200',
  },
  {
    id: 'delivery',
    label: 'Delivery',
    description: 'We deliver to your address',
    icon: <Truck className="w-6 h-6" />,
    color: 'bg-orange-50 text-orange-600 border-orange-200',
  },
  {
    id: 'reservation',
    label: 'Reservation',
    description: 'Book a table for later',
    icon: <CalendarCheck className="w-6 h-6" />,
    color: 'bg-purple-50 text-purple-600 border-purple-200',
  },
];

export const OrderTypePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedType, setSelectedType] = useState<OrderType | null>(null);

  // Preserve table from QR scan if present
  const tableFromQR = searchParams.get('table');

  const handleContinue = () => {
    if (!selectedType) return;

    // Store order type
    localStorage.setItem('mat-qr-order-type', selectedType);

    // If dine-in and table from QR, store it
    if (selectedType === 'dine-in' && tableFromQR) {
      localStorage.setItem('mat-qr-table', tableFromQR);
    }

    // Navigate to menu
    navigate('/menu');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-4 py-6 text-center">
        <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <UtensilsCrossed className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome to MAT.ai</h1>
        <p className="text-gray-500 mt-1">Select how you would like to order</p>
        {tableFromQR && (
          <p className="text-sm text-primary-600 mt-2 font-medium">
            Table: {tableFromQR}
          </p>
        )}
      </header>

      {/* Order Type Options */}
      <div className="flex-1 p-4 space-y-3">
        {orderTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setSelectedType(type.id)}
            className={`w-full p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${
              selectedType === type.id
                ? `${type.color} border-current ring-2 ring-offset-2 ring-primary-500`
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                selectedType === type.id ? 'bg-white/50' : 'bg-gray-100'
              }`}>
                {type.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">{type.label}</h3>
                <p className="text-sm text-gray-500">{type.description}</p>
              </div>
              <ChevronRight className={`w-5 h-5 transition-transform ${
                selectedType === type.id ? 'translate-x-1' : ''
              }`} />
            </div>
          </button>
        ))}
      </div>

      {/* Continue Button */}
      <div className="bg-white border-t px-4 py-4 safe-bottom">
        <button
          onClick={handleContinue}
          disabled={!selectedType}
          className="w-full py-3.5 bg-primary-600 text-white rounded-xl font-semibold text-lg disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
