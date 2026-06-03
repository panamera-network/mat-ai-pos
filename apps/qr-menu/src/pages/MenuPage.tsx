import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, Plus, ChefHat, AlertCircle } from 'lucide-react';
import type { MenuItem, Category } from '@mat-ai/types';
import { fetchMenuAvailability, startAvailabilityPolling } from '../lib/sync';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Load from localStorage (shared with POS) - fallback to static
const getMenuItems = (): MenuItem[] => {
  try {
    const saved = localStorage.getItem('mat-pos-menu-items');
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return [];
};

const getCategories = (): Category[] => {
  try {
    const saved = localStorage.getItem('mat-pos-categories');
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return [];
};

interface CartItem {
  menuId: string;
  name: string;
  price: number;
  qty: number;
  modifiers: string[];
}

export const MenuPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('mat-qr-cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [showModifierModal, setShowModifierModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);
  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [availabilityUpdated, setAvailabilityUpdated] = useState<string>('');

  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const categories = useMemo(() => getCategories(), []);

  // Start availability polling
  useEffect(() => {
    const cleanup = startAvailabilityPolling((avail) => {
      setAvailability(avail);
      setAvailabilityUpdated(new Date().toLocaleTimeString());
    });
    return cleanup;
  }, []);

  // Auto-select first category
  useEffect(() => {
    if (!activeCategory && categories.length > 0) {
      setActiveCategory(categories[0].id);
    }
  }, [activeCategory, categories]);

  useEffect(() => {
  fetch(`${API_URL}/menu-items`)
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch menu');
      return res.json();
    })
    .then(data => {
      setMenuItems(data);
      setLoading(false);
    })
    .catch(err => {
      console.error('Failed to load menu:', err);
      setLoading(false);
    });
}, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('mat-qr-cart', JSON.stringify(cart));
  }, [cart]);

  const filteredItems = useMemo(() => {
    let items = menuItems;
    if (searchQuery) {
      items = items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else if (activeCategory) {
      items = items.filter((item) => item.categoryId === activeCategory);
    }
    return items;
  }, [menuItems, activeCategory, searchQuery]);

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const isAvailable = (itemId: string): boolean => {
    // If no availability data, assume available (fail open)
    if (Object.keys(availability).length === 0) return true;
    return availability[itemId] !== false;
  };

  const addToCart = (item: MenuItem, mods: string[] = []) => {
    if (!isAvailable(item.id)) return;

    setCart((prev) => {
      const existing = prev.find(
        (i) => i.menuId === item.id && JSON.stringify(i.modifiers) === JSON.stringify(mods)
      );
      if (existing) {
        return prev.map((i) =>
          i.menuId === item.id && JSON.stringify(i.modifiers) === JSON.stringify(mods)
            ? { ...i, qty: i.qty + 1 }
            : i
        );
      }
      return [...prev, {
        menuId: item.id,
        name: item.name,
        price: item.price,
        qty: 1,
        modifiers: mods,
      }];
    });
  };

  const handleItemClick = (item: MenuItem) => {
    if (!isAvailable(item.id)) return;

    if (item.modifiers?.length) {
      setSelectedItem(item);
      setSelectedModifiers([]);
      setShowModifierModal(true);
    } else {
      addToCart(item);
    }
  };

  const handleSaveModifier = () => {
    if (selectedItem) {
      addToCart(selectedItem, selectedModifiers);
      setShowModifierModal(false);
      setSelectedItem(null);
      setSelectedModifiers([]);
    }
  };

  const toggleModifier = (mod: string) => {
    setSelectedModifiers((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">MAT.ai</h1>
              <p className="text-xs text-gray-500">Scan & Order</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/cart')}
            className="relative p-3 bg-gray-100 rounded-xl"
          >
            <ShoppingCart className="w-6 h-6 text-gray-700" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
      </header>

      {/* Availability notice */}
      {availabilityUpdated && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600" />
          <span className="text-xs text-blue-700">
            Menu updated at {availabilityUpdated}
          </span>
        </div>
      )}

      {/* Category Tabs */}
      {!searchQuery && categories.length > 0 && (
        <div className="sticky top-[110px] z-30 bg-gray-50 px-4 py-2 overflow-x-auto">
          <div className="flex gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-white text-gray-700 border'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Menu Grid */}
      <div className="p-4">
        {menuItems.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <ChefHat className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No Menu Available</p>
            <p className="text-sm mt-1">Please ask staff to set up the menu</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredItems.map((item) => {
              const available = isAvailable(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  disabled={!available}
                  className={`bg-white rounded-2xl border p-3 text-left transition-all relative ${
                    available 
                      ? 'active:scale-95' 
                      : 'opacity-60 cursor-not-allowed'
                  }`}
                >
                  {!available && (
                    <div className="absolute inset-0 bg-gray-100/80 rounded-2xl flex items-center justify-center z-10">
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        SOLD OUT
                      </span>
                    </div>
                  )}
                  <div className="aspect-square bg-gray-100 rounded-xl mb-3 flex items-center justify-center text-4xl">
                    {item.image || '🍽️'}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
                    {item.name}
                  </h3>
                  <p className="text-lg font-bold text-primary-600 mt-1">
                    RM{item.price.toFixed(2)}
                  </p>
                  {item.modifiers?.length > 0 && available && (
                    <span className="text-xs text-gray-400">+ Customizable</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Cart Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 safe-bottom bg-white border-t px-4 py-3 shadow-lg">
          <button
            onClick={() => navigate('/cart')}
            className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold flex items-center justify-between px-4 active:scale-[0.98] transition-all"
          >
            <span>{cartCount} items</span>
            <span>View Cart • RM{cartTotal.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Modifier Modal */}
      {showModifierModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowModifierModal(false)} />
          <div className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 max-h-[80vh] overflow-auto">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">{selectedItem.image || '🍽️'}</div>
              <h2 className="text-xl font-bold">{selectedItem.name}</h2>
              <p className="text-lg font-bold text-primary-600">RM{selectedItem.price.toFixed(2)}</p>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-sm font-medium text-gray-700">Select Options:</p>
              {selectedItem.modifiers?.map((mod) => (
                <label
                  key={mod}
                  onClick={() => toggleModifier(mod)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedModifiers.includes(mod)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedModifiers.includes(mod) ? 'bg-primary-600 border-primary-600' : 'border-gray-300'
                  }`}>
                    {selectedModifiers.includes(mod) && <Plus className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm font-medium">{mod}</span>
                </label>
              ))}
            </div>

            <button
              onClick={handleSaveModifier}
              className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold active:scale-[0.98] transition-all"
            >
              Add to Cart
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
