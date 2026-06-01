// apps/pos/src/pages/MenuEditPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Plus,
  Edit3,
  ToggleLeft,
  ToggleRight,
  Lock,
  Tag,
  Layers,
  Puzzle,
  Percent,
} from 'lucide-react';

type TabType = 'items' | 'categories' | 'modifiers' | 'discounts';

interface MenuItemData {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  minStock: number;
  isAvailable: boolean;
  icon: string;
}

interface CategoryData {
  id: string;
  name: string;
  icon: string;
  itemCount: number;
}

interface ModifierData {
  id: string;
  name: string;
  price: number;
}

interface DiscountData {
  id: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  isActive: boolean;
}

const demoItems: MenuItemData[] = [
  { id: '1', name: 'Margherita Pizza', price: 25, category: 'Pizza', stock: 45, minStock: 10, isAvailable: true, icon: '🍕' },
  { id: '2', name: 'Pepperoni Pizza', price: 28, category: 'Pizza', stock: 12, minStock: 10, isAvailable: true, icon: '🍕' },
  { id: '3', name: 'Hawaiian Pizza', price: 27, category: 'Pizza', stock: 8, minStock: 10, isAvailable: true, icon: '🍕' },
  { id: '4', name: 'Carbonara', price: 22, category: 'Pasta', stock: 30, minStock: 5, isAvailable: true, icon: '🍝' },
  { id: '5', name: 'Bolognese', price: 24, category: 'Pasta', stock: 25, minStock: 5, isAvailable: true, icon: '🍝' },
  { id: '6', name: 'Nasi Goreng', price: 15, category: 'Nasi', stock: 50, minStock: 10, isAvailable: true, icon: '🍚' },
  { id: '7', name: 'Pepsi', price: 5, category: 'Beverages', stock: 100, minStock: 20, isAvailable: true, icon: '🥤' },
  { id: '8', name: 'Fries', price: 8, category: 'Side Order', stock: 40, minStock: 10, isAvailable: true, icon: '🍟' },
  { id: '9', name: 'Extra Cheese', price: 5, category: 'Extras', stock: 200, minStock: 50, isAvailable: true, icon: '➕' },
];

const demoCategories: CategoryData[] = [
  { id: '1', name: 'Pizza', icon: '🍕', itemCount: 3 },
  { id: '2', name: 'Pasta', icon: '🍝', itemCount: 2 },
  { id: '3', name: 'Nasi', icon: '🍚', itemCount: 1 },
  { id: '4', name: 'Beverages', icon: '🥤', itemCount: 1 },
  { id: '5', name: 'Side Order', icon: '🍟', itemCount: 1 },
  { id: '6', name: 'Extras', icon: '➕', itemCount: 1 },
];

const demoModifiers: ModifierData[] = [
  { id: '1', name: 'Extra Cheese', price: 5 },
  { id: '2', name: 'Extra Sauce', price: 3 },
  { id: '3', name: 'Thin Crust', price: 0 },
  { id: '4', name: 'No Onion', price: 0 },
  { id: '5', name: 'Spicy', price: 0 },
];

const demoDiscounts: DiscountData[] = [
  { id: '1', name: 'Member Discount', type: 'percentage', value: 10, isActive: true },
  { id: '2', name: 'Happy Hour', type: 'percentage', value: 15, isActive: false },
  { id: '3', name: 'RM5 Off', type: 'fixed', value: 5, isActive: true },
];

export const MenuEditPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('items');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPinModal, setShowPinModal] = useState(true);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [items, setItems] = useState(demoItems);
  const [showAddModal, setShowAddModal] = useState(false);

  const handlePinSubmit = () => {
    if (pin === '0000') {
      setIsAuthenticated(true);
      setShowPinModal(false);
    } else {
      setPinError('Invalid admin PIN');
      setPin('');
    }
  };

  const toggleAvailability = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isAvailable: !item.isAvailable } : item
      )
    );
  };

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { id: 'items' as TabType, label: 'All Items', icon: Tag },
    { id: 'categories' as TabType, label: 'Categories', icon: Layers },
    { id: 'modifiers' as TabType, label: 'Modifiers', icon: Puzzle },
    { id: 'discounts' as TabType, label: 'Discounts', icon: Percent },
  ];

  if (!isAuthenticated) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        {showPinModal && (
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-primary-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Admin Access Required</h2>
              <p className="text-sm text-gray-500 mt-1">Enter admin PIN to edit menu</p>
            </div>

            <div className="space-y-4">
              <input
                type="password"
                value={pin}
                onChange={(e) => { setPin(e.target.value); setPinError(''); }}
                placeholder="Enter PIN"
                maxLength={4}
                className="w-full text-center text-2xl tracking-widest py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none"
              />
              {pinError && (
                <p className="text-center text-sm text-red-600">{pinError}</p>
              )}
              <button
                onClick={handlePinSubmit}
                className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors"
              >
                Unlock
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

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
          <h1 className="font-bold text-gray-900">Edit Menu</h1>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'items' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-lg">
            <Lock className="w-4 h-4 text-green-700" />
            <span className="text-sm font-medium text-green-700">Admin</span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b px-4">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Items Tab */}
        {activeTab === 'items' && (
          <div className="max-w-4xl mx-auto">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            {/* Items List */}
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white rounded-xl border p-4 ${!item.isAvailable ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{item.icon}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-500">
                          {item.category} | Stock: {item.stock} | Min: {item.minStock}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary-600">RM{item.price.toFixed(2)}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        item.isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {item.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <button className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition-colors">
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => toggleAvailability(item.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                    >
                      {item.isAvailable ? (
                        <>
                          <ToggleRight className="w-3.5 h-3.5 text-green-600" />
                          Disable
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-3.5 h-3.5 text-gray-400" />
                          Enable
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="max-w-2xl mx-auto space-y-3">
            {demoCategories.map((cat) => (
              <div key={cat.id} className="bg-white rounded-xl border p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{cat.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                    <p className="text-sm text-gray-500">{cat.itemCount} items</p>
                  </div>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Edit3 className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            ))}
            <button className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors flex items-center justify-center gap-2">
              <Plus className="w-5 h-5" />
              Add Category
            </button>
          </div>
        )}

        {/* Modifiers Tab */}
        {activeTab === 'modifiers' && (
          <div className="max-w-2xl mx-auto space-y-3">
            {demoModifiers.map((mod) => (
              <div key={mod.id} className="bg-white rounded-xl border p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{mod.name}</h3>
                  <p className="text-sm text-gray-500">
                    {mod.price === 0 ? 'Free' : `+RM${mod.price.toFixed(2)}`}
                  </p>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Edit3 className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            ))}
            <button className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors flex items-center justify-center gap-2">
              <Plus className="w-5 h-5" />
              Add Modifier
            </button>
          </div>
        )}

        {/* Discounts Tab */}
        {activeTab === 'discounts' && (
          <div className="max-w-2xl mx-auto space-y-3">
            {demoDiscounts.map((disc) => (
              <div key={disc.id} className="bg-white rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{disc.name}</h3>
                    <p className="text-sm text-gray-500">
                      {disc.type === 'percentage' ? `${disc.value}%` : `RM${disc.value.toFixed(2)}`} off
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      disc.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {disc.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <Edit3 className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <button className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors flex items-center justify-center gap-2">
              <Plus className="w-5 h-5" />
              Add Discount
            </button>
          </div>
        )}
      </div>
    </div>
  );
};