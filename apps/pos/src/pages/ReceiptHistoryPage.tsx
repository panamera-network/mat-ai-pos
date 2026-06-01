import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Printer,
  RotateCcw,
  Mail,
  Filter,
  ChevronDown,
  Receipt,
} from 'lucide-react';

interface ReceiptData {
  id: string;
  receiptNo: string;
  tableNumber: string;
  orderType: string;
  time: string;
  cashier: string;
  posId: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  paymentMethod: string;
}

const demoReceipts: ReceiptData[] = [
  {
    id: '1',
    receiptNo: '20260530-001',
    tableNumber: 'T01',
    orderType: 'dine-in',
    time: '10:30 AM',
    cashier: 'Ahmad',
    posId: 'POS-1',
    items: [
      { name: 'Margherita', qty: 2, price: 25 },
      { name: 'Pepsi', qty: 1, price: 5 },
    ],
    total: 59.40,
    paymentMethod: 'cash',
  },
  {
    id: '2',
    receiptNo: '20260530-002',
    tableNumber: 'T05',
    orderType: 'takeaway',
    time: '10:45 AM',
    cashier: 'Sarah',
    posId: 'POS-1',
    items: [
      { name: 'Carbonara', qty: 1, price: 22 },
      { name: 'Teh Tarik', qty: 1, price: 4 },
    ],
    total: 28.08,
    paymentMethod: 'qr',
  },
  {
    id: '3',
    receiptNo: '20260530-003',
    tableNumber: 'T10',
    orderType: 'dine-in',
    time: '11:15 AM',
    cashier: 'Ahmad',
    posId: 'POS-1',
    items: [
      { name: 'Pepperoni', qty: 1, price: 28 },
      { name: 'Hawaiian', qty: 1, price: 27 },
      { name: 'Fries', qty: 2, price: 8 },
    ],
    total: 74.52,
    paymentMethod: 'card',
  },
  {
    id: '4',
    receiptNo: '20260530-004',
    tableNumber: '-',
    orderType: 'delivery',
    time: '11:30 AM',
    cashier: 'Ahmad',
    posId: 'POS-1',
    items: [
      { name: 'Nasi Goreng', qty: 3, price: 15 },
      { name: 'Coke', qty: 3, price: 5 },
    ],
    total: 64.80,
    paymentMethod: 'delivery',
  },
];

const getPaymentIcon = (method: string) => {
  switch (method) {
    case 'cash': return '💵';
    case 'qr': return '📱';
    case 'card': return '💳';
    case 'delivery': return '🚚';
    default: return '💰';
  }
};

const getOrderTypeColor = (type: string) => {
  switch (type) {
    case 'dine-in': return 'bg-blue-100 text-blue-700';
    case 'takeaway': return 'bg-orange-100 text-orange-700';
    case 'delivery': return 'bg-purple-100 text-purple-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

export const ReceiptHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

  const filteredReceipts = demoReceipts.filter(
    (r) =>
      r.receiptNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.cashier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePrint = (receipt: ReceiptData) => {
    alert(`Printing receipt ${receipt.receiptNo}...`);
  };

  const handleReprintOrder = (receipt: ReceiptData) => {
    alert(`Reprinting order slip for ${receipt.receiptNo} to kitchen display...`);
  };

  const handleEmail = (receipt: ReceiptData) => {
    const email = prompt('Enter email address:');
    if (email) {
      alert(`Sending receipt ${receipt.receiptNo} to ${email}...`);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="font-bold text-gray-900">Receipt History</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search receipt #, table, cashier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-gray-100 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              showFilter ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filter
            <ChevronDown className={`w-3 h-3 transition-transform ${showFilter ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </header>

      {/* Filter Panel */}
      {showFilter && (
        <div className="bg-white border-b px-4 py-3 flex gap-4">
          <button className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
            All
          </button>
          <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
            Dine-in
          </button>
          <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
            Takeaway
          </button>
          <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
            Delivery
          </button>
          <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
            Today
          </button>
          <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
            This Week
          </button>
        </div>
      )}

      {/* Receipts List */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {filteredReceipts.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No receipts found</p>
              <p className="text-sm text-gray-400">Try adjusting your search</p>
            </div>
          ) : (
            filteredReceipts.map((receipt) => (
              <div
                key={receipt.id}
                className={`bg-white rounded-2xl shadow-sm border transition-all ${
                  selectedReceipt === receipt.id ? 'ring-2 ring-primary-500' : ''
                }`}
              >
                {/* Receipt Header */}
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-gray-900">{receipt.receiptNo}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getOrderTypeColor(receipt.orderType)}`}>
                        {receipt.orderType}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">{receipt.time}</span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Table: {receipt.tableNumber}</span>
                    <span>•</span>
                    <span>Cashier: {receipt.cashier}</span>
                    <span>•</span>
                    <span>POS: {receipt.posId}</span>
                  </div>
                </div>

                {/* Receipt Items */}
                <div className="p-4">
                  <div className="space-y-1 mb-3">
                    {receipt.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-700">
                          {item.qty}x {item.name}
                        </span>
                        <span className="font-medium">RM{(item.qty * item.price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getPaymentIcon(receipt.paymentMethod)}</span>
                      <span className="text-sm text-gray-500 capitalize">{receipt.paymentMethod}</span>
                    </div>
                    <span className="text-xl font-bold text-primary-600">
                      RM{receipt.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Receipt Actions */}
                <div className="px-4 pb-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePrint(receipt)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      <Printer className="w-4 h-4" />
                      Print
                    </button>
                    <button
                      onClick={() => handleReprintOrder(receipt)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-100 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reprint Order
                    </button>
                    <button
                      onClick={() => handleEmail(receipt)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      Email
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Summary Footer */}
      <div className="bg-white border-t px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-500">
            Showing <span className="font-medium text-gray-900">{filteredReceipts.length}</span> receipts
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-500">
            Total: <span className="font-bold text-gray-900">RM{filteredReceipts.reduce((s, r) => s + r.total, 0).toFixed(2)}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
