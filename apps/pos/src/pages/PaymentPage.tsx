import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Banknote,
  QrCode,
  CreditCard,
  Truck,
  Check,
  Split,
  MoreVertical,
} from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

const paymentMethods: PaymentMethod[] = [
  { id: 'cash', name: 'Cash', icon: <Banknote className="w-6 h-6" />, color: 'bg-green-500' },
  { id: 'qr', name: 'QR Pay', icon: <QrCode className="w-6 h-6" />, color: 'bg-blue-500' },
  { id: 'card', name: 'Card', icon: <CreditCard className="w-6 h-6" />, color: 'bg-purple-500' },
  { id: 'delivery', name: 'Delivery', icon: <Truck className="w-6 h-6" />, color: 'bg-orange-500' },
];

// Demo order data
const demoOrder = {
  id: '001',
  type: 'dine-in',
  table: 'T01',
  items: [
    { name: 'Margherita', qty: 2, price: 25 },
    { name: 'Pepsi', qty: 1, price: 5 },
  ],
  subtotal: 55,
  tax: 4.40,
  total: 59.40,
};

export const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [selectedMethod, setSelectedMethod] = useState('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const change = cashReceived ? parseFloat(cashReceived) - demoOrder.total : 0;
  const isValidPayment = selectedMethod !== 'cash' || (cashReceived && parseFloat(cashReceived) >= demoOrder.total);

  const handleQuickAmount = (amount: number) => {
    setCashReceived(amount.toFixed(2));
  };

  const handleExactAmount = () => {
    setCashReceived(demoOrder.total.toFixed(2));
  };

  const handlePayment = () => {
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      navigate('/dashboard');
    }, 3000);
  };

  if (showSuccess) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-green-50">
        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <Check className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment Received!</h2>
        <p className="text-lg text-gray-600 mb-1">RM {demoOrder.total.toFixed(2)}</p>
        <p className="text-sm text-gray-500">Order #{orderId}</p>
        <div className="mt-8 flex gap-4">
          <button className="px-6 py-3 bg-white border rounded-xl font-medium hover:bg-gray-50 shadow-sm">
            🖨️ Print Receipt
          </button>
          <button className="px-6 py-3 bg-white border rounded-xl font-medium hover:bg-gray-50 shadow-sm">
            📧 Email
          </button>
          <button className="px-6 py-3 bg-white border rounded-xl font-medium hover:bg-gray-50 shadow-sm">
            💾 Save PDF
          </button>
        </div>
        <p className="mt-6 text-xs text-gray-400">Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/pos')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="font-bold text-gray-900">Payment — Order #{orderId}</h1>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200">
            <Split className="w-4 h-4" />
            <span className="text-sm font-medium">Split Bill</span>
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <MoreVertical className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Order Summary Card */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  {demoOrder.type}
                </span>
                <span className="ml-2 text-sm text-gray-500">Table {demoOrder.table}</span>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {demoOrder.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-700">
                    {item.qty}x {item.name}
                  </span>
                  <span className="font-medium">RM{(item.qty * item.price).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">RM{demoOrder.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">SST (8%)</span>
                <span className="font-medium">RM{demoOrder.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total</span>
                <span className="text-primary-600">RM{demoOrder.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Payment Method</h3>

            <div className="grid grid-cols-4 gap-3 mb-6">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    selectedMethod === method.id
                      ? 'border-primary-500 bg-primary-50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-12 h-12 ${method.color} rounded-xl flex items-center justify-center text-white`}>
                    {method.icon}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{method.name}</span>
                </button>
              ))}
            </div>

            {/* Cash Payment Section */}
            {selectedMethod === 'cash' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount Received
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                      RM
                    </span>
                    <input
                      type="number"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-12 pr-4 py-3 text-lg font-bold border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none"
                    />
                  </div>
                </div>

                {cashReceived && (
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                    <span className="text-sm font-medium text-gray-700">Change</span>
                    <span className={`text-xl font-bold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      RM {change >= 0 ? change.toFixed(2) : '0.00'}
                    </span>
                  </div>
                )}

                {/* Quick Amount Buttons */}
                <div className="grid grid-cols-5 gap-2">
                  {['20', '30', '50', '100'].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleQuickAmount(parseFloat(amount))}
                      className="py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      RM{amount}
                    </button>
                  ))}
                  <button
                    onClick={handleExactAmount}
                    className="py-2 bg-primary-100 text-primary-700 rounded-lg text-sm font-medium hover:bg-primary-200 transition-colors"
                  >
                    Exact
                  </button>
                </div>
              </div>
            )}

            {/* QR Payment Section */}
            {selectedMethod === 'qr' && (
              <div className="text-center py-8">
                <div className="w-48 h-48 bg-gray-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
                  <QrCode className="w-24 h-24 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600">Scan QR code to pay</p>
                <p className="text-xs text-gray-400 mt-1">DuitNow / GrabPay / TouchNGo</p>
              </div>
            )}

            {/* Card Payment Section */}
            {selectedMethod === 'card' && (
              <div className="text-center py-8">
                <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600">Insert or tap card</p>
                <p className="text-xs text-gray-400 mt-1">Terminal will process automatically</p>
              </div>
            )}

            {/* Delivery Payment Section */}
            {selectedMethod === 'delivery' && (
              <div className="text-center py-8">
                <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600">Delivery order</p>
                <p className="text-xs text-gray-400 mt-1">Payment on delivery</p>
              </div>
            )}
          </div>

          {/* Process Payment Button */}
          <button
            onClick={handlePayment}
            disabled={!isValidPayment}
            className="w-full py-4 bg-primary-600 text-white rounded-xl font-bold text-lg
                       hover:bg-primary-700 active:bg-primary-800 transition-colors shadow-lg
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
          >
            <Check className="w-6 h-6" />
            Process Payment — RM{demoOrder.total.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
};
