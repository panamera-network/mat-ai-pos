import React, { useState, useEffect, useCallback } from 'react';
import { useApi } from '@mat-ai/backoffice';
import type { MenuItem, Category } from '@mat-ai/types';
import {
  Search, Plus, Edit3, ToggleLeft, ToggleRight,
  Tag, Layers, Puzzle, Percent, ImageIcon, Upload, X, Save
} from 'lucide-react';

interface Modifier {
  id: string;
  name: string;
  price: number;
  categoryId?: string;
  isActive?: boolean;
}

interface Discount {
  id: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'BUY_X_GET_Y';
  value: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
}

type TabType = 'items' | 'categories' | 'modifiers' | 'discounts';

export const MenuPage: React.FC = () => {
  const { get, patch, post, del } = useApi();

  const [activeTab, setActiveTab] = useState<TabType>('items');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [modifiers, setModifiers] = useState<Modifier[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);

  // Modal states
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemForm, setItemForm] = useState({
    name: '', price: '', categoryId: '', stock: '', minStock: '', description: '', imageUrl: '', modifierIds: [] as string[]
  });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', icon: '', sortOrder: '0', isActive: true });
  const [showModifierModal, setShowModifierModal] = useState(false);
  const [editingModifier, setEditingModifier] = useState<Modifier | null>(null);
  const [modifierForm, setModifierForm] = useState({ name: '', price: '0', categoryId: '', isActive: true });
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [discountForm, setDiscountForm] = useState({
    name: '',
    type: 'PERCENTAGE' as Discount['type'],
    value: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    isActive: true,
  });

  const fetchData = useCallback(async () => {
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
  }, [get]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleAvailability = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const newStatus = !item.isAvailable;
    setItems(prev => prev.map((i) => i.id === id ? { ...i, isAvailable: newStatus } : i));
    const res = await patch(`/menu-items/${id}`, { isAvailable: newStatus });
    if (!res.ok) {
      setItems(prev => prev.map((i) => i.id === id ? { ...i, isAvailable: !newStatus } : i));
    }
  };

  const handleBulkToggle = async () => {
    const ids = Array.from(selectedItems);
    await Promise.all(ids.map(id => patch(`/menu-items/${id}`, { isAvailable: true })));
    setItems(prev => prev.map(i => selectedItems.has(i.id) ? { ...i, isAvailable: true } : i));
    setSelectedItems(new Set());
  };

  const handleSaveItem = async () => {
    if (!itemForm.name.trim() || !itemForm.categoryId) {
      alert('Name and category are required.');
      return;
    }

    const selectedModifiers = modifiers.filter((modifier) => itemForm.modifierIds.includes(modifier.id));
    const payload = {
      name: itemForm.name.trim(),
      price: parseFloat(itemForm.price),
      categoryId: itemForm.categoryId,
      imageUrl: itemForm.imageUrl || undefined,
      stock: parseInt(itemForm.stock) || 0,
      minStock: parseInt(itemForm.minStock) || 0,
      options: selectedModifiers.length > 0 ? [{
        id: 'modifiers',
        name: 'Modifiers',
        required: false,
        multiSelect: true,
        choices: selectedModifiers.map((modifier) => ({
          id: modifier.id,
          name: modifier.name,
          priceModifier: Number(modifier.price || 0),
        })),
      }] : [],
    };
    if (editingItem) {
      await patch(`/menu-items/${editingItem.id}`, payload);
    } else {
      await post('/menu-items', payload);
    }
    setShowItemModal(false);
    setEditingItem(null);
    fetchData();
  };

  const openEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      price: item.price.toString(),
      categoryId: item.categoryId || '',
      stock: (item.stock ?? 0).toString(),
      minStock: (item.minStock ?? 0).toString(),
      description: (item as any).description || '',
      imageUrl: item.imageUrl || '',
      modifierIds: item.options?.flatMap((option) => option.choices?.map((choice) => choice.id) || []) || [],
    });
    setShowItemModal(true);
  };

  const openCategoryModal = (category?: Category) => {
    setEditingCategory(category || null);
    setCategoryForm({
      name: category?.name || '',
      icon: category?.icon || '',
      sortOrder: String(category?.sortOrder ?? categories.length),
      isActive: (category as any)?.isActive ?? true,
    });
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async () => {
    const payload = {
      name: categoryForm.name.trim(),
      icon: categoryForm.icon || undefined,
      sortOrder: parseInt(categoryForm.sortOrder) || 0,
      isActive: categoryForm.isActive,
    };
    if (!payload.name) return;
    if (editingCategory) {
      await patch(`/categories/${editingCategory.id}`, payload);
    } else {
      await post('/categories', payload);
    }
    setShowCategoryModal(false);
    setEditingCategory(null);
    fetchData();
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!confirm(`Disable category ${category.name}?`)) return;
    await del(`/categories/${category.id}`);
    fetchData();
  };

  const openModifierModal = (modifier?: Modifier) => {
    setEditingModifier(modifier || null);
    setModifierForm({
      name: modifier?.name || '',
      price: String(modifier?.price ?? 0),
      categoryId: modifier?.categoryId || '',
      isActive: modifier?.isActive ?? true,
    });
    setShowModifierModal(true);
  };

  const handleSaveModifier = async () => {
    const payload = {
      name: modifierForm.name.trim(),
      price: parseFloat(modifierForm.price) || 0,
      categoryId: modifierForm.categoryId || undefined,
      isActive: modifierForm.isActive,
    };
    if (!payload.name) return;
    if (editingModifier) {
      await patch(`/modifiers/${editingModifier.id}`, payload);
    } else {
      await post('/modifiers', payload);
    }
    setShowModifierModal(false);
    setEditingModifier(null);
    fetchData();
  };

  const handleDeleteModifier = async (modifier: Modifier) => {
    if (!confirm(`Delete modifier ${modifier.name}?`)) return;
    await del(`/modifiers/${modifier.id}`);
    fetchData();
  };

  const openDiscountModal = (discount?: Discount) => {
    setEditingDiscount(discount || null);
    setDiscountForm({
      name: discount?.name || '',
      type: discount?.type || 'PERCENTAGE',
      value: String(discount?.value ?? ''),
      startDate: discount?.startDate ? new Date(discount.startDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      endDate: discount?.endDate ? new Date(discount.endDate).toISOString().slice(0, 10) : new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      isActive: discount?.isActive ?? true,
    });
    setShowDiscountModal(true);
  };

  const handleSaveDiscount = async () => {
    const payload = {
      name: discountForm.name.trim(),
      type: discountForm.type,
      value: parseFloat(discountForm.value) || 0,
      startDate: new Date(discountForm.startDate).toISOString(),
      endDate: new Date(discountForm.endDate).toISOString(),
      isActive: discountForm.isActive,
    };
    if (!payload.name) return;
    if (editingDiscount) {
      await patch(`/discounts/${editingDiscount.id}`, payload);
    } else {
      await post('/discounts', payload);
    }
    setShowDiscountModal(false);
    setEditingDiscount(null);
    fetchData();
  };

  const handleDeleteDiscount = async (discount: Discount) => {
    if (!confirm(`Delete discount ${discount.name}?`)) return;
    await del(`/discounts/${discount.id}`);
    fetchData();
  };

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.categoryId && categories.find(c => c.id === item.categoryId)?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const tabs = [
    { id: 'items' as TabType, label: `All Items (${items.length})`, icon: Tag },
    { id: 'categories' as TabType, label: 'Categories', icon: Layers },
    { id: 'modifiers' as TabType, label: 'Modifiers', icon: Puzzle },
    { id: 'discounts' as TabType, label: 'Discounts', icon: Percent },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage menu items, categories, modifiers, and discounts</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedItems.size > 0 && (
            <button
              onClick={handleBulkToggle}
              className="px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100"
            >
              Enable Selected ({selectedItems.size})
            </button>
          )}
          <button
            onClick={() => {
              setEditingItem(null);
              setItemForm({ name: '', price: '', categoryId: '', stock: '', minStock: '', description: '', imageUrl: '', modifierIds: [] });
              setShowItemModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border rounded-lg p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Items Tab */}
      {activeTab === 'items' && (
        <>
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search items by name or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {loading && items.length === 0 && (
            <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-200">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p>Loading menu items...</p>
            </div>
          )}

          {!loading && filteredItems.length === 0 && (
            <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-200">
              <Tag className="w-12 h-12 mx-auto mb-3" />
              <p>No items found</p>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
                      onChange={() => {
                        if (selectedItems.size === filteredItems.length) setSelectedItems(new Set());
                        else setSelectedItems(new Set(filteredItems.map(i => i.id)));
                      }}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Item</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Category</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Price</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Stock</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.map((item) => (
                  <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${!item.isAvailable ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => {
                          const newSet = new Set(selectedItems);
                          if (newSet.has(item.id)) newSet.delete(item.id);
                          else newSet.add(item.id);
                          setSelectedItems(newSet);
                        }}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{categories.find(c => c.id === item.categoryId)?.name || item.categoryId || '-'}</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">RM{(Number(item.price) || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <span className={`${(item.stock ?? 0) < (item.minStock ?? 0) ? 'text-red-600 font-medium' : ''}`}>
                        {item.stock ?? 0}
                      </span>
                      <span className="text-gray-400"> / min {item.minStock ?? 0}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${item.isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {item.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditItem(item)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => toggleAvailability(item.id)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-green-600">
                          {item.isAvailable ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Categories</h3>
            <button onClick={() => openCategoryModal()} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              Add Category
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
                    {cat.icon || '📂'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{cat.name}</p>
                    <p className="text-xs text-gray-500">{items.filter(i => i.categoryId === cat.id).length} items</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                <button onClick={() => openCategoryModal(cat)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <Edit3 className="w-4 h-4 text-gray-400" />
                </button>
                <button onClick={() => handleDeleteCategory(cat)} className="p-2 hover:bg-red-50 rounded-lg">
                  <X className="w-4 h-4 text-gray-400 hover:text-red-600" />
                </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modifiers Tab */}
      {activeTab === 'modifiers' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Modifiers</h3>
            <button onClick={() => openModifierModal()} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              Add Modifier
            </button>
          </div>
          <div className="space-y-3">
            {modifiers.map((mod) => (
              <div key={mod.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{mod.name}</p>
                  <p className="text-sm text-gray-500">{mod.price === 0 ? 'Free' : `+RM${mod.price.toFixed(2)}`}</p>
                </div>
                <div className="flex items-center gap-2">
                <button onClick={() => openModifierModal(mod)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <Edit3 className="w-4 h-4 text-gray-400" />
                </button>
                <button onClick={() => handleDeleteModifier(mod)} className="p-2 hover:bg-red-50 rounded-lg">
                  <X className="w-4 h-4 text-gray-400 hover:text-red-600" />
                </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discounts Tab */}
      {activeTab === 'discounts' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Discounts</h3>
            <button onClick={() => openDiscountModal()} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              Add Discount
            </button>
          </div>
          <div className="space-y-3">
            {discounts.map((disc) => (
              <div key={disc.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{disc.name}</p>
                  <p className="text-sm text-gray-500">
                    {disc.type === 'PERCENTAGE' ? `${disc.value}%` : `RM${disc.value.toFixed(2)}`} off
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${disc.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {disc.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button onClick={() => openDiscountModal(disc)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <Edit3 className="w-4 h-4 text-gray-400" />
                  </button>
                  <button onClick={() => handleDeleteDiscount(disc)} className="p-2 hover:bg-red-50 rounded-lg">
                    <X className="w-4 h-4 text-gray-400 hover:text-red-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900">{editingItem ? 'Edit Item' : 'Add New Item'}</h3>
              <button onClick={() => setShowItemModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input value={itemForm.name} onChange={e => setItemForm({...itemForm, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (RM)</label>
                  <input type="number" step="0.01" value={itemForm.price} onChange={e => setItemForm({...itemForm, price: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={itemForm.categoryId} onChange={e => setItemForm({...itemForm, categoryId: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Modifiers</label>
                <div className="grid grid-cols-2 gap-2">
                  {modifiers.length === 0 && (
                    <p className="col-span-2 text-sm text-gray-400">No modifiers yet</p>
                  )}
                  {modifiers.map((modifier) => (
                    <label key={modifier.id} className="flex items-center justify-between gap-2 p-2 border rounded-lg text-sm hover:bg-gray-50">
                      <span>
                        {modifier.name}
                        <span className="ml-1 text-xs text-gray-500">
                          {Number(modifier.price || 0) === 0 ? 'Free' : `+RM${Number(modifier.price || 0).toFixed(2)}`}
                        </span>
                      </span>
                      <input
                        type="checkbox"
                        checked={itemForm.modifierIds.includes(modifier.id)}
                        onChange={(e) => {
                          const modifierIds = e.target.checked
                            ? [...itemForm.modifierIds, modifier.id]
                            : itemForm.modifierIds.filter((id) => id !== modifier.id);
                          setItemForm({ ...itemForm, modifierIds });
                        }}
                      />
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                  <input type="number" value={itemForm.stock} onChange={e => setItemForm({...itemForm, stock: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock</label>
                  <input type="number" value={itemForm.minStock} onChange={e => setItemForm({...itemForm, minStock: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <div className="flex gap-2">
                  <input value={itemForm.imageUrl} onChange={e => setItemForm({...itemForm, imageUrl: e.target.value})} placeholder="https://..." className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                  <button className="px-3 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-1">
                    <Upload className="w-4 h-4" />
                    Upload
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={itemForm.description} onChange={e => setItemForm({...itemForm, description: e.target.value})} rows={3} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t">
              <button onClick={() => setShowItemModal(false)} className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSaveItem} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900">{editingCategory ? 'Edit Category' : 'Add Category'}</h3>
              <button onClick={() => setShowCategoryModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                  <input value={categoryForm.icon} onChange={e => setCategoryForm({...categoryForm, icon: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="🍜" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                  <input type="number" value={categoryForm.sortOrder} onChange={e => setCategoryForm({...categoryForm, sortOrder: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              {editingCategory && (
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={categoryForm.isActive} onChange={e => setCategoryForm({...categoryForm, isActive: e.target.checked})} />
                  Active
                </label>
              )}
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t">
              <button onClick={() => setShowCategoryModal(false)} className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSaveCategory} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}

      {showModifierModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900">{editingModifier ? 'Edit Modifier' : 'Add Modifier'}</h3>
              <button onClick={() => setShowModifierModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input value={modifierForm.name} onChange={e => setModifierForm({...modifierForm, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (RM)</label>
                  <input type="number" step="0.01" value={modifierForm.price} onChange={e => setModifierForm({...modifierForm, price: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={modifierForm.categoryId} onChange={e => setModifierForm({...modifierForm, categoryId: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option value="">All categories</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={modifierForm.isActive} onChange={e => setModifierForm({...modifierForm, isActive: e.target.checked})} />
                Active
              </label>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t">
              <button onClick={() => setShowModifierModal(false)} className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSaveModifier} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}

      {showDiscountModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900">{editingDiscount ? 'Edit Discount' : 'Add Discount'}</h3>
              <button onClick={() => setShowDiscountModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input value={discountForm.name} onChange={e => setDiscountForm({...discountForm, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={discountForm.type} onChange={e => setDiscountForm({...discountForm, type: e.target.value as Discount['type']})} className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FIXED_AMOUNT">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                  <input type="number" step="0.01" value={discountForm.value} onChange={e => setDiscountForm({...discountForm, value: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="date" value={discountForm.startDate} onChange={e => setDiscountForm({...discountForm, startDate: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" value={discountForm.endDate} onChange={e => setDiscountForm({...discountForm, endDate: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={discountForm.isActive} onChange={e => setDiscountForm({...discountForm, isActive: e.target.checked})} />
                Active
              </label>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t">
              <button onClick={() => setShowDiscountModal(false)} className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSaveDiscount} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
