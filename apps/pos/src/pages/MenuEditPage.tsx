import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Search, Plus, Edit3, ToggleLeft, ToggleRight,
  Tag, Layers, Puzzle, Percent, ImageIcon,
} from 'lucide-react';
import { useApi, useAuthStore } from '@mat-ai/backoffice';
import type { MenuItem, Category } from '@mat-ai/types';

// Local types for POS-only features
interface Modifier {
  id: string;
  name: string;
  price: number;
  isActive?: boolean;
}

interface Discount {
  id: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  isActive: boolean;
}

type TabType = 'items' | 'categories' | 'modifiers' | 'discounts';

export const MenuEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { get, patch } = useApi();
  const { staff } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabType>('items');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [modifiers, setModifiers] = useState<Modifier[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [itemsRes, catsRes, modsRes, discsRes] = await Promise.all([
          get('/menu-items'),
          get('/categories'),
          get('/modifiers'),
          get('/discounts'),
        ]);

        if (itemsRes.ok) setItems((itemsRes.data as any[]) || []);
        if (catsRes.ok) setCategories((catsRes.data as any[]) || []);
        if (modsRes.ok) setModifiers((modsRes.data as any[]) || []);
        if (discsRes.ok) setDiscounts((discsRes.data as any[]) || []);
      } catch (err) {
        console.error('Menu fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [get]);

  const toggleAvailability = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const newStatus = !item.isAvailable;

    // Optimistic update
    setItems(prev => prev.map((i) => i.id === id ? { ...i, isAvailable: newStatus } : i));

    // API call
    const res = await patch(`/menu-items/${id}`, { isAvailable: newStatus });
    if (!res.ok) {
      // Revert on failure
      setItems(prev => prev.map((i) => i.id === id ? { ...i, isAvailable: !newStatus } : i));
      alert('Failed to update availability');
    }
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
          <h1 className="font-bold text-gray-900">Menu Management</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {/* TODO: Add item modal */}}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-lg">
            <span className="text-sm font-medium text-green-700">{staff?.role || 'Admin'}</span>
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

            {/* Loading */}
            {loading && items.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p>Loading menu items...</p>
              </div>
            )}

            {/* Items List */}
            {!loading && filteredItems.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Tag className="w-12 h-12 mx-auto mb-3" />
                <p>No items found</p>
                <p className="text-sm">Add items via "Add Item" button</p>
              </div>
            )}

            <div className="space-y-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white rounded-xl border p-4 ${
                    !item.isAvailable ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl overflow-hidden">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-500">
                          {categories.find(c => c.id === item.categoryId)?.name || item.categoryId} | 
                          Stock: {item.stock ?? 0} | Min: {item.minStock ?? 0}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary-600">
                        RM{(Number(item.price) || 0).toFixed(2)}
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
              ))}
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="max-w-2xl mx-auto space-y-3">
            {categories.length === 0 && !loading && (
              <div className="text-center py-12 text-gray-400">
                <Layers className="w-12 h-12 mx-auto mb-3" />
                <p>No categories found</p>
              </div>
            )}
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-white rounded-xl border p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
                    {cat.icon || '📂'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                    <p className="text-xs text-gray-500">Sort: {cat.sortOrder}</p>
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
            {modifiers.length === 0 && !loading && (
              <div className="text-center py-12 text-gray-400">
                <Puzzle className="w-12 h-12 mx-auto mb-3" />
                <p>No modifiers found</p>
              </div>
            )}
            {modifiers.map((mod) => (
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
            {discounts.length === 0 && !loading && (
              <div className="text-center py-12 text-gray-400">
                <Percent className="w-12 h-12 mx-auto mb-3" />
                <p>No discounts found</p>
              </div>
            )}
            {discounts.map((disc) => (
              <div key={disc.id} className="bg-white rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{disc.name}</h3>
                    <p className="text-sm text-gray-500">
                      {disc.type === 'percentage' ? `${disc.value}%` : `RM${disc.value.toFixed(2)}`} off
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