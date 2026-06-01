// apps/pos/src/pages/MenuEditPage.tsx
import React, { useState, useEffect } from 'react';
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
import type { MenuItem, Category, Modifier, Discount } from '@mat-ai/types';

type TabType = 'items' | 'categories' | 'modifiers' | 'discounts';

const getMenuItems = (): MenuItem[] => {
  try {
    const saved = localStorage.getItem('mat-pos-menu-items');
    if (saved) return JSON.parse(saved);
  } catch {
    /* ignore */
  }
  return [];
};

const getCategories = (): Category[] => {
  try {
    const saved = localStorage.getItem('mat-pos-categories');
    if (saved) return JSON.parse(saved);
  } catch {
    /* ignore */
  }
  return [];
};

const getModifiers = (): Modifier[] => {
  try {
    const saved = localStorage.getItem('mat-pos-modifiers');
    if (saved) return JSON.parse(saved);
  } catch {
    /* ignore */
  }
  return [];
};

const getDiscounts = (): Discount[] => {
  try {
    const saved = localStorage.getItem('mat-pos-discounts');
    if (saved) return JSON.parse(saved);
  } catch {
    /* ignore */
  }
  return [];
};

export const MenuEditPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('items');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPinModal, setShowPinModal] = useState(true);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [modifiers, setModifiers] = useState<Modifier[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    setItems(getMenuItems());
    setCategories(getCategories());
    setModifiers(getModifiers());
    setDiscounts(getDiscounts());
  }, []);

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
      (item.categoryId && item.categoryId.toLowerCase().includes(searchQuery.toLowerCase()))
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
                onChange={(e) => {
                  setPin(e.target.value);
                  setPinError('');
                }}
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
              {filteredItems.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p>No items found</p>
                  <p className="text-sm">Add items via "Add Item" button</p>
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className={`bg-white rounded-xl border p-4 ${
                      !item.isAvailable ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{item.image || '🍽️'}</span>
                        <div>
                          <h3 className="font-semibold text-gray-900">{item.name}</h3>
                          <p className="text-sm text-gray-500">
                            {item.categoryId} | Stock: {item.stock ?? 0} | Min: {item.minStock ?? 0}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary-600">
                          RM{item.price.toFixed(2)}
                        </p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            item.isAvailable
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
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
                ))
              )}
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="max-w-2xl mx-auto space-y-3">
            {categories.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p>No categories found</p>
              </div>
            ) : (
              categories.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-white rounded-xl border p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{cat.icon || '📂'}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Edit3 className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              ))
            )}
            <button className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors flex items-center justify-center gap-2">
              <Plus className="w-5 h-5" />
              Add Category
            </button>
          </div>
        )}

        {/* Modifiers Tab */}
        {activeTab === 'modifiers' && (
          <div className="max-w-2xl mx-auto space-y-3">
            {modifiers.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p>No modifiers found</p>
              </div>
            ) : (
              modifiers.map((mod) => (
                <div
                  key={mod.id}
                  className="bg-white rounded-xl border p-4 flex items-center justify-between"
                >
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
              ))
            )}
            <button className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors flex items-center justify-center gap-2">
              <Plus className="w-5 h-5" />
              Add Modifier
            </button>
          </div>
        )}

        {/* Discounts Tab */}
        {activeTab === 'discounts' && (
          <div className="max-w-2xl mx-auto space-y-3">
            {discounts.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p>No discounts found</p>
              </div>
            ) : (
              discounts.map((disc) => (
                <div key={disc.id} className="bg-white rounded-xl border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{disc.name}</h3>
                      <p className="text-sm text-gray-500">
                        {disc.type === 'percentage'
                          ? `${disc.value}%`
                          : `RM${disc.value.toFixed(2)}`}{' '}
                        off
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          disc.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {disc.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <button className="p-2 hover:bg-gray-100 rounded-lg">
                        <Edit3 className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
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