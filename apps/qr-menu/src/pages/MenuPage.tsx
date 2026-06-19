// apps/qr-menu/src/pages/MenuPage.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, Plus, ChefHat, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import type { MenuItem, Category } from '@mat-ai/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

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
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModifierModal, setShowModifierModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/menu-items`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: MenuItem[]) => {
        setMenuItems(data);
        setError(null);
      })
      .catch(err => {
        console.error('Failed to load menu:', err);
        setError('Unable to load menu. Please try again.');
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const catMap = new Map<string, Category>();
    menuItems.forEach(item => {
      if (item.category && !catMap.has(item.category.id)) {
        catMap.set(item.category.id, item.category);
      }
    });
    return Array.from(catMap.values()).sort((a, b) => a.sortOrder - b.sortOrder);
  }, [menuItems]);

  useEffect(() => {
    if (!activeCategory && categories.length > 0) {
      setActiveCategory(categories[0].id);
    }
  }, [activeCategory, categories]);

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

  const addToCart = (item: MenuItem, mods: string[] = []) => {
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
        price: Number(item.price),
        qty: 1,
        modifiers: mods,
      }];
    });
  };

  const handleItemClick = (item: MenuItem) => {
    const hasOptions = item.options && Array.isArray(item.options) && item.options.length > 0;
    if (hasOptions) {
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

  const getOptionValues = (item: MenuItem | null): string[] => {
    if (!item?.options || !Array.isArray(item.options)) return [];
    return item.options.flatMap(opt => 
      opt.choices.map(c => `${opt.name}: ${c.name}`)
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header — Orange Theme */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => navigate('/')} className="p-2 -ml-2 text-white/80 hover:text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <ChefHat className="w-6 h-6" />
            <h1 className="font-bold">Menu</h1>
          </div>
          <button
            onClick={() => navigate('/cart')}
            className="relative p-2 bg-white/20 rounded-xl"
          >
            <ShoppingCart className="w-6 h-6" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 text-orange-700 text-xs rounded-full flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
          <input
            type="text"
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/20 rounded-xl text-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
        </div>
      </header>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
          <p className="text-gray-500">Loading menu...</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {/* Category Tabs — Orange */}
      {!loading && !error && categories.length > 0 && (
        <div className="sticky top-[73px] z-30 bg-gray-50 px-4 py-2 overflow-x-auto">
          <div className="flex gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-orange-300'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Menu Grid */}
      {!loading && !error && (
        <div className="p-4">
          {menuItems.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ChefHat className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No Menu Available</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No items found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  disabled={item.isAvailable === false}
                  className={`bg-white rounded-2xl border p-3 text-left transition-all relative ${
                    item.isAvailable !== false 
                      ? 'active:scale-95 hover:shadow-md' 
                      : 'opacity-60 cursor-not-allowed'
                  }`}
                >
                  {item.isAvailable === false && (
                    <div className="absolute inset-0 bg-gray-100/80 rounded-2xl flex items-center justify-center z-10">
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        SOLD OUT
                      </span>
                    </div>
                  )}
                  <div className="aspect-square bg-gradient-to-br from-orange-100 to-red-100 rounded-xl mb-3 flex items-center justify-center text-4xl">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      '🍽️'
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
                    {item.name}
                  </h3>
                  <p className="text-lg font-bold text-orange-600 mt-1">
                    RM{Number(item.price).toFixed(2)}
                  </p>
                  {item.options && Array.isArray(item.options) && item.options.length > 0 && (
                    <span className="text-xs text-orange-400">+ Customizable</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Floating Cart Bar — Orange */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 safe-bottom bg-white border-t px-4 py-3 shadow-lg">
          <button
            onClick={() => navigate('/cart')}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold flex items-center justify-between px-4 active:scale-[0.98] transition-all"
          >
            <span>{cartCount} items</span>
            <span>View Cart • RM{cartTotal.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Modifier Modal — Orange */}
      {showModifierModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowModifierModal(false)} />
          <div className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 max-h-[80vh] overflow-auto">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🍽️</div>
              <h2 className="text-xl font-bold">{selectedItem.name}</h2>
              <p className="text-lg font-bold text-orange-600">RM{Number(selectedItem.price).toFixed(2)}</p>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-sm font-medium text-gray-700">Select Options:</p>
              {getOptionValues(selectedItem).map((mod) => (
                <label
                  key={mod}
                  onClick={() => toggleModifier(mod)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedModifiers.includes(mod)
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedModifiers.includes(mod) ? 'bg-orange-500 border-orange-500' : 'border-gray-300'
                  }`}>
                    {selectedModifiers.includes(mod) && <Plus className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm font-medium">{mod}</span>
                </label>
              ))}
            </div>

            <button
              onClick={handleSaveModifier}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold active:scale-[0.98] transition-all"
            >
              Add to Cart
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
