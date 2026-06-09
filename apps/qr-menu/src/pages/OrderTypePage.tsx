// apps/qr-menu/src/pages/OrderTypePage.tsx
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UtensilsCrossed, ShoppingBag, Truck, CalendarCheck, ChevronRight, X, Clock, Table, User, Phone, Users, MapPin } from 'lucide-react';
import type { OrderType } from '@mat-ai/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface OrderTypeOption {
  id: OrderType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const orderTypes: OrderTypeOption[] = [
  {
    id: 'DINE_IN',
    label: 'Dine In',
    description: 'Order and eat at the restaurant',
    icon: <UtensilsCrossed className="w-6 h-6" />,
    color: 'bg-blue-50 text-blue-600 border-blue-200',
  },
  {
    id: 'PICKUP',
    label: 'Pickup',
    description: 'Order now, pick up at counter',
    icon: <ShoppingBag className="w-6 h-6" />,
    color: 'bg-green-50 text-green-600 border-green-200',
  },
  {
    id: 'DELIVERY',
    label: 'Delivery',
    description: 'We deliver to your address',
    icon: <Truck className="w-6 h-6" />,
    color: 'bg-orange-50 text-orange-600 border-orange-200',
  },
  {
    id: 'RESERVATION',
    label: 'Reservation',
    description: 'Book a table for later',
    icon: <CalendarCheck className="w-6 h-6" />,
    color: 'bg-purple-50 text-purple-600 border-purple-200',
  },
];

interface TableData {
  id: string;
  number: string;
  name?: string;
  capacity: number;
}

export const OrderTypePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedType, setSelectedType] = useState<OrderType | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [tables, setTables] = useState<TableData[]>([]);

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [selectedTable, setSelectedTable] = useState('');
  const [pax, setPax] = useState(1);
  const [reservationTime, setReservationTime] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const tableFromQR = searchParams.get('table');

  const handleSelectType = (type: OrderType) => {
    setSelectedType(type);
    setFormError('');

    // Load tables if needed
    if (type === 'DINE_IN' || type === 'RESERVATION') {
      fetch(`${API_URL}/tables`)
        .then(res => res.json())
        .then(data => {
          setTables(data);
          // Auto-select QR table if dine-in
          if (type === 'DINE_IN' && tableFromQR) {
            const matched = data.find((t: TableData) => t.number === tableFromQR || t.id === tableFromQR);
            if (matched) setSelectedTable(matched.id);
          }
        })
        .catch(err => console.error('Failed to load tables:', err));
    }

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

  const handleOrderNow = () => {
    if (!validateForm()) return;

    // Save form data to localStorage for CartPage to use
    localStorage.setItem('mat-qr-order-type', selectedType!);
    localStorage.setItem('mat-qr-customer-name', customerName);
    localStorage.setItem('mat-qr-customer-phone', customerPhone);
    if (customerAddress) localStorage.setItem('mat-qr-customer-address', customerAddress);
    if (selectedTable) localStorage.setItem('mat-qr-table-id', selectedTable);
    if (pax) localStorage.setItem('mat-qr-pax', String(pax));
    if (reservationTime) localStorage.setItem('mat-qr-reservation-time', reservationTime);

    navigate('/menu');
  };

  const handleOrderLater = async () => {
    if (!validateForm()) return;

    setSubmitting(true);

    // Reservation without items — send directly
    const orderData = {
      type: 'RESERVATION',
      source: 'QR_MENU',
      totalAmount: 0,
      customerName,
      customerPhone,
      tableId: selectedTable,
      pax,
      reservationTime: new Date(reservationTime).toISOString(),
      items: [],
    };

    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      // Save to localStorage
      const orderView = {
        ...data,
        totalAmount: 0,
        taxAmount: 0,
        subtotal: 0,
        tax: 0,
        finalTotal: 0,
        tableNumber: tables.find(t => t.id === selectedTable)?.number,
        items: [],
      };

      const existingOrders = JSON.parse(localStorage.getItem('mat-pos-active-orders') || '[]');
      existingOrders.push(orderView);
      localStorage.setItem('mat-pos-active-orders', JSON.stringify(existingOrders));

      navigate(`/status/${data.id}`);
    } catch (err) {
      console.error('Failed to submit reservation:', err);
      setFormError('Failed to send reservation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setSelectedType(null);
    setFormError('');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setSelectedTable('');
    setPax(1);
    setReservationTime('');
  };

  const needsTable = selectedType === 'DINE_IN' || selectedType === 'RESERVATION';
  const needsAddress = selectedType === 'DELIVERY';
  const isReservation = selectedType === 'RESERVATION';

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
            onClick={() => handleSelectType(type.id)}
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

      {/* Form Modal */}
      {showForm && selectedType && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-black/60" onClick={closeForm} />
          <div className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 max-h-[85vh] overflow-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {selectedType === 'DINE_IN' && '🍽️ Dine In'}
                {selectedType === 'PICKUP' && '🥡 Pickup'}
                {selectedType === 'DELIVERY' && '🛵 Delivery'}
                {selectedType === 'RESERVATION' && '📅 Reservation'}
              </h2>
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

            {/* Action Buttons */}
            {isReservation ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleOrderLater}
                  disabled={submitting}
                  className="py-3 bg-purple-100 text-purple-700 rounded-xl font-semibold active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {submitting ? 'Sending...' : 'Order Later'}
                </button>
                <button
                  onClick={handleOrderNow}
                  className="py-3 bg-primary-600 text-white rounded-xl font-semibold active:scale-[0.98] transition-all"
                >
                  Order Now
                </button>
              </div>
            ) : (
              <button
                onClick={handleOrderNow}
                className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold active:scale-[0.98] transition-all"
              >
                Continue to Menu
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};