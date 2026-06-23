import { useEffect, useState, useCallback } from 'react';
import { useApi } from '@mat-ai/backoffice';
import type { InventoryItem, StockLog, StockType } from '@mat-ai/types';
import {
  AlertTriangle, Package, RefreshCw, Plus,
  Search, History, Edit3, Trash2, X,
  Save, Minus, Settings2, Calculator, ChefHat,
  TrendingUp, BarChart3, ArrowRight
} from 'lucide-react';


type ModalType = 'add' | 'edit' | 'adjust' | 'history' | 'cost-impact' | null;
type InventoryTab = 'all' | 'frozen' | 'chiller' | 'dry' | 'cheese' | 'vegetables' | 'sauce' | 'pasta' | 'oil' | 'prepared';

const CATEGORY_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  frozen: { label: '❄️ Frozen', icon: '❄️', color: 'bg-blue-100 text-blue-700' },
  chiller: { label: '🧊 Chiller', icon: '🧊', color: 'bg-cyan-100 text-cyan-700' },
  dry: { label: '📦 Dry Storage', icon: '📦', color: 'bg-amber-100 text-amber-700' },
  cheese: { label: '🧀 Cheese', icon: '🧀', color: 'bg-yellow-100 text-yellow-700' },
  vegetables: { label: '🥬 Vegetables', icon: '🥬', color: 'bg-green-100 text-green-700' },
  sauce: { label: '🥫 Sauce', icon: '🥫', color: 'bg-red-100 text-red-700' },
  pasta: { label: '🍝 Pasta', icon: '🍝', color: 'bg-orange-100 text-orange-700' },
  oil: { label: '🫒 Oil', icon: '🫒', color: 'bg-emerald-100 text-emerald-700' },
  prepared: { label: '🔪 Prepared', icon: '🔪', color: 'bg-purple-100 text-purple-700' },
};

export const InventoryPage: React.FC = () => {
  const { get, patch, post, del } = useApi();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<InventoryTab>('all');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'category' | 'unitPrice'>('name');

  // Modal states
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'frozen',
    packPrice: '',
    weight: '',
    unitOfMeasure: 'g',
    openStock: '',
    stockIn: '',
    stockOut: '',
    minStock: '50',
    supplier: '',
    description: '',
  });
  const [adjustData, setAdjustData] = useState({
    quantity: '',
    reason: '',
    type: 'MANUAL_IN' as StockType,
  });
  const [adjustments, setAdjustments] = useState<StockLog[]>([]);
  const [costImpact, setCostImpact] = useState<any>(null);

  // ==========================================
  // FETCH DATA
  // ==========================================
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get('/inventory');
      if (res.ok) {
        const data = (res.data as any[]) || [];
        setItems(data.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category || 'dry',
          unit: item.unitOfMeasure || item.unit || 'g',
          unitOfMeasure: item.unitOfMeasure || item.unit || 'g',
          weight: item.weight ?? 0,
          currentStock: item.currentStock ?? ((item.openStock ?? 0) + (item.stockIn ?? 0) - (item.stockOut ?? 0)),
          minStock: item.minStock ?? 50,
          costPerUnit: item.unitPrice ?? item.costPerUnit ?? 0,
          unitPrice: item.unitPrice ?? item.costPerUnit ?? 0,
          packPrice: item.packPrice ?? (item.unitPrice && item.weight ? item.unitPrice * item.weight : 0),
          openStock: item.openStock ?? 0,
          stockIn: item.stockIn ?? 0,
          stockOut: item.stockOut ?? 0,
          close: (item.openStock ?? 0) + (item.stockIn ?? 0) - (item.stockOut ?? 0),
          supplier: item.supplier || '',
          description: item.description || '',
          isActive: item.isActive ?? true,
          outletId: item.outletId,
          ingredients: item.ingredients || item.menuItemIngredients || [],
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: item.updatedAt || new Date().toISOString(),
        })));
      }
    } catch (err) {
      console.error('Inventory fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [get]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // ==========================================
  // CRUD OPERATIONS
  // ==========================================
  const handleSaveItem = async () => {
    const weight = parseFloat(formData.weight) || 0;
    const packPrice = parseFloat(formData.packPrice) || 0;
    const unitPrice = weight > 0 ? packPrice / weight : 0;
    const openStock = parseFloat(formData.openStock) || 0;
    const stockIn = parseFloat(formData.stockIn) || 0;
    const stockOut = parseFloat(formData.stockOut) || 0;

    const payload = {
      name: formData.name,
      category: formData.category,
      unitPrice: Math.round(unitPrice * 10000) / 10000,
      unitOfMeasure: formData.unitOfMeasure,
      weight,
      packPrice,
      openStock,
      stockIn,
      stockOut,
      minStock: parseFloat(formData.minStock) || 50,
      supplier: formData.supplier,
      description: formData.description,
    };

    if (modalType === 'edit' && selectedItem) {
      await patch(`/inventory/${selectedItem.id}`, payload);
    } else {
      await post('/inventory', payload);
    }
    closeModal();
    fetchItems();
  };

  const handleAdjustStock = async () => {
    if (!selectedItem) return;
    const qty = parseFloat(adjustData.quantity) || 0;

    const updateField = adjustData.type === 'MANUAL_IN' ? 'stockIn' : 'stockOut';
    const currentValue = selectedItem[updateField] || 0;

    await patch(`/inventory/${selectedItem.id}`, {
      [updateField]: currentValue + qty,
    });

    // Add to adjustment history
    setAdjustments(prev => [{
      id: Date.now().toString(),
      inventoryItemId: selectedItem.id,
      inventoryItem: selectedItem,
      type: adjustData.type,
      quantity: qty,
      reason: adjustData.reason,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as StockLog, ...prev]);

    closeModal();
    fetchItems();
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Delete this item? This will also remove it from any recipes.')) return;
    await del(`/inventory/${id}`);
    fetchItems();
  };

  // ==========================================
  // COST IMPACT (fetch from costing API)
  // ==========================================
  const fetchCostImpact = async (item: InventoryItem) => {
    try {
      const res = await get(`/costing/inventory/${item.id}/impact?newPrice=${(item.unitPrice ?? 0) * 1.1}`);
      if (res.ok) {
        setCostImpact(res.data);
      }
    } catch (err) {
      console.error('Cost impact fetch error:', err);
    }
  };

  // ==========================================
  // MODAL HELPERS
  // ==========================================
  const openModal = (type: ModalType, item?: InventoryItem) => {
    setModalType(type);
    if (item) {
      setSelectedItem(item);
      if (type === 'edit') {
        setFormData({
          name: item.name,
          category: item.category || 'frozen',
          packPrice: item.packPrice?.toString() || (((item.unitPrice ?? 0) * (item.weight ?? 0)) || 0).toString(),
          weight: item.weight?.toString() || '',
          unitOfMeasure: item.unitOfMeasure || 'g',
          openStock: item.openStock?.toString() || '0',
          stockIn: item.stockIn?.toString() || '0',
          stockOut: item.stockOut?.toString() || '0',
          minStock: item.minStock?.toString() || '50',
          supplier: item.supplier || '',
          description: item.description || '',
        });
      } else if (type === 'adjust') {
        setAdjustData({ quantity: '', reason: '', type: 'MANUAL_IN' });
      } else if (type === 'cost-impact') {
        fetchCostImpact(item);
      }
    } else {
      setSelectedItem(null);
      setFormData({
        name: '', category: 'frozen', packPrice: '', weight: '',
        unitOfMeasure: 'g', openStock: '', stockIn: '', stockOut: '',
        minStock: '50', supplier: '', description: '',
      });
      setCostImpact(null);
    }
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedItem(null);
    setCostImpact(null);
    setFormData({
      name: '', category: 'frozen', packPrice: '', weight: '',
      unitOfMeasure: 'g', openStock: '', stockIn: '', stockOut: '',
      minStock: '50', supplier: '', description: '',
    });
    setAdjustData({ quantity: '', reason: '', type: 'MANUAL_IN' });
  };

  // ==========================================
  // FILTERING & SORTING
  // ==========================================
  const filteredItems = items
    .filter(item => activeTab === 'all' || item.category === activeTab)
    .filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'stock') return (a.close ?? 0) - (b.close ?? 0);
      if (sortBy === 'category') return a.category.localeCompare(b.category);
      if (sortBy === 'unitPrice') return (a.unitPrice ?? 0) - (b.unitPrice ?? 0);
      return 0;
    });

  // Stats
  const lowStockCount = items.filter(i => {
    const close = i.close ?? ((i.openStock ?? 0) + (i.stockIn ?? 0) - (i.stockOut ?? 0));
    return close > 0 && close < (i.minStock ?? 50);
  }).length;
  const outOfStockCount = items.filter(i => {
    const close = i.close ?? ((i.openStock ?? 0) + (i.stockIn ?? 0) - (i.stockOut ?? 0));
    return close <= 0;
  }).length;
  const totalInventoryValue = items.reduce((sum, item) => {
    const close = item.close ?? ((item.openStock ?? 0) + (item.stockIn ?? 0) - (item.stockOut ?? 0));
    return sum + (close * (item.unitPrice || 0));
  }, 0);

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory & Costing</h1>
          <p className="text-sm text-gray-500 mt-1">Track stock levels, unit prices, and recipe costs</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchItems()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => openModal('add')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Ingredient
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div className="flex items-center gap-4">
          {lowStockCount > 0 && (
            <div className="flex-1 flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-orange-800">{lowStockCount} items low on stock</p>
                <p className="text-xs text-orange-600">Below minimum threshold</p>
              </div>
            </div>
          )}
          {outOfStockCount > 0 && (
            <div className="flex-1 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <Package className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-red-800">{outOfStockCount} items out of stock</p>
                <p className="text-xs text-red-600">Immediate restock required</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Total Ingredients</p>
          <p className="text-2xl font-bold text-gray-900">{items.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Low Stock</p>
          <p className="text-2xl font-bold text-orange-600">{lowStockCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Out of Stock</p>
          <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Inventory Value</p>
          <p className="text-2xl font-bold text-green-600">RM {totalInventoryValue.toFixed(2)}</p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'all' ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'
          }`}
        >
          All Items
        </button>
        {Object.entries(CATEGORY_LABELS).map(([key, { label }]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as InventoryTab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === key ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search ingredients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-2 bg-white border rounded-lg text-sm"
        >
          <option value="name">Sort by Name</option>
          <option value="stock">Sort by Stock</option>
          <option value="category">Sort by Category</option>
          <option value="unitPrice">Sort by Unit Price</option>
        </select>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Ingredient</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Unit Price</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Open</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">In</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Out</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Close</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Recipes</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredItems.map((item) => {
              const close = item.close ?? ((item.openStock ?? 0) + (item.stockIn ?? 0) - (item.stockOut ?? 0));
              const isLow = close > 0 && close < (item.minStock ?? 50);
              const isOut = close <= 0;
              const recipeCount = item.ingredients?.length ?? 0;
              const catStyle = CATEGORY_LABELS[item.category] || { color: 'bg-gray-100 text-gray-700' };

              return (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.supplier || 'No supplier'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${catStyle.color}`}>
                      {item.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className="text-sm font-medium text-gray-900">RM {item.unitPrice?.toFixed(4)}/<span className="text-xs text-gray-500">{item.unitOfMeasure}</span></p>
                    <p className="text-xs text-gray-500">Pack: RM {item.packPrice?.toFixed(2)} ({item.weight}{item.unitOfMeasure})</p>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600">{item.openStock ?? 0}</td>
                  <td className="px-4 py-3 text-right text-sm text-green-600 font-medium">+{item.stockIn ?? 0}</td>
                  <td className="px-4 py-3 text-right text-sm text-red-600 font-medium">-{item.stockOut ?? 0}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-sm font-bold ${isOut ? 'text-red-600' : isLow ? 'text-orange-600' : 'text-gray-900'}`}>
                      {close}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {isOut ? (
                      <span className="inline-flex px-2 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-700">HABIS</span>
                    ) : isLow ? (
                      <span className="inline-flex px-2 py-1 rounded-lg text-xs font-medium bg-orange-100 text-orange-700">RENDAH</span>
                    ) : (
                      <span className="inline-flex px-2 py-1 rounded-lg text-xs font-medium bg-green-100 text-green-700">OK</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {recipeCount > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-purple-100 text-purple-700">
                        <ChefHat className="w-3 h-3" />
                        {recipeCount} menu
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => openModal('edit', item)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600"
                        title="Edit Item"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => openModal('adjust', item)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-orange-600"
                        title="Adjust Stock"
                      >
                        <Settings2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => openModal('cost-impact', item)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-green-600"
                        title="Cost Impact"
                      >
                        <TrendingUp className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => openModal('history', item)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-purple-600"
                        title="View History"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600"
                        title="Delete Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredItems.length === 0 && !loading && (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center text-gray-400">
                  <Package className="w-8 h-8 mx-auto mb-2" />
                  <p>No inventory items found</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ==========================================
          MODALS
      ========================================== */}

      {/* ADD / EDIT MODAL */}
      {(modalType === 'add' || modalType === 'edit') && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900">
                {modalType === 'edit' ? 'Edit Ingredient' : 'Add New Ingredient'}
              </h3>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ingredient Name</label>
                <input 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="w-full px-3 py-2 border rounded-lg text-sm" 
                  placeholder="e.g. Mozzarella Cheese"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select 
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([key, { label }]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Measure</label>
                  <select 
                    value={formData.unitOfMeasure} 
                    onChange={e => setFormData({...formData, unitOfMeasure: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="g">Gram (g)</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="ml">Milliliter (ml)</option>
                    <option value="l">Liter (l)</option>
                    <option value="pcs">Pieces (pcs)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pack Price (RM)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={formData.packPrice} 
                    onChange={e => setFormData({...formData, packPrice: e.target.value})} 
                    className="w-full px-3 py-2 border rounded-lg text-sm" 
                    placeholder="Price per pack/box"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight/Pack ({formData.unitOfMeasure})</label>
                  <input 
                    type="number" 
                    value={formData.weight} 
                    onChange={e => setFormData({...formData, weight: e.target.value})} 
                    className="w-full px-3 py-2 border rounded-lg text-sm" 
                    placeholder="e.g. 1000"
                  />
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700">
                  <Calculator className="w-3 h-3 inline mr-1" />
                  Unit Price will be auto-calculated: <strong>RM {(parseFloat(formData.packPrice || '0') / (parseFloat(formData.weight || '1'))).toFixed(4)}/{formData.unitOfMeasure}</strong>
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Open Stock</label>
                  <input 
                    type="number" 
                    value={formData.openStock} 
                    onChange={e => setFormData({...formData, openStock: e.target.value})} 
                    className="w-full px-3 py-2 border rounded-lg text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock In</label>
                  <input 
                    type="number" 
                    value={formData.stockIn} 
                    onChange={e => setFormData({...formData, stockIn: e.target.value})} 
                    className="w-full px-3 py-2 border rounded-lg text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Out</label>
                  <input 
                    type="number" 
                    value={formData.stockOut} 
                    onChange={e => setFormData({...formData, stockOut: e.target.value})} 
                    className="w-full px-3 py-2 border rounded-lg text-sm" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock Alert Level</label>
                <input 
                  type="number" 
                  value={formData.minStock} 
                  onChange={e => setFormData({...formData, minStock: e.target.value})} 
                  className="w-full px-3 py-2 border rounded-lg text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier (optional)</label>
                <input 
                  value={formData.supplier} 
                  onChange={e => setFormData({...formData, supplier: e.target.value})} 
                  className="w-full px-3 py-2 border rounded-lg text-sm" 
                  placeholder="e.g. Syarikat Ayam Sdn Bhd"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <textarea 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg text-sm" 
                  placeholder="Item description..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t">
              <button onClick={closeModal} className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSaveItem} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                <Save className="w-4 h-4" />
                {modalType === 'edit' ? 'Update Ingredient' : 'Add Ingredient'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADJUST STOCK MODAL */}
      {modalType === 'adjust' && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900">Adjust Stock: {selectedItem.name}</h3>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Open</p>
                  <p className="text-lg font-bold text-gray-700">{selectedItem.openStock ?? 0}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-green-600">In</p>
                  <p className="text-lg font-bold text-green-700">+{selectedItem.stockIn ?? 0}</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-xs text-red-600">Out</p>
                  <p className="text-lg font-bold text-red-700">-{selectedItem.stockOut ?? 0}</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-blue-700">Current Close Stock</span>
                <span className="text-lg font-bold text-blue-900">
                  {(selectedItem.openStock ?? 0) + (selectedItem.stockIn ?? 0) - (selectedItem.stockOut ?? 0)} {selectedItem.unitOfMeasure}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Adjustment Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAdjustData({...adjustData, type: 'MANUAL_IN'})}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      adjustData.type === 'MANUAL_IN' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    Stock In (Receive / Open)
                  </button>
                  <button
                    onClick={() => setAdjustData({...adjustData, type: 'AUTO_DEDUCT'})}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      adjustData.type === 'AUTO_DEDUCT' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Minus className="w-4 h-4" />
                    Stock Out (Use)
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity ({selectedItem.unitOfMeasure})</label>
                <input 
                  type="number" 
                  value={adjustData.quantity} 
                  onChange={e => setAdjustData({...adjustData, quantity: e.target.value})} 
                  className="w-full px-3 py-2 border rounded-lg text-sm" 
                  placeholder={`Enter quantity...`}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <input 
                  value={adjustData.reason} 
                  onChange={e => setAdjustData({...adjustData, reason: e.target.value})} 
                  className="w-full px-3 py-2 border rounded-lg text-sm" 
                  placeholder="e.g. Restock from supplier, Kitchen usage, Spoiled..."
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                <span className="text-sm text-gray-700">New Close Stock</span>
                <span className="text-lg font-bold text-gray-900">
                  {adjustData.type === 'MANUAL_IN' 
                    ? (selectedItem.openStock ?? 0) + (selectedItem.stockIn ?? 0) + (parseFloat(adjustData.quantity) || 0) - (selectedItem.stockOut ?? 0)
                    : (selectedItem.openStock ?? 0) + (selectedItem.stockIn ?? 0) - (selectedItem.stockOut ?? 0) - (parseFloat(adjustData.quantity) || 0)
                  } {selectedItem.unitOfMeasure}
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t">
              <button onClick={closeModal} className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleAdjustStock} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                <Save className="w-4 h-4" />
                Save Adjustment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COST IMPACT MODAL */}
      {modalType === 'cost-impact' && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900">Cost Impact: {selectedItem.name}</h3>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {!costImpact ? (
                <div className="text-center py-8">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2 text-gray-400 animate-pulse" />
                  <p className="text-gray-500">Calculating impact...</p>
                </div>
              ) : costImpact.affectedMenus?.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <ChefHat className="w-8 h-8 mx-auto mb-2" />
                  <p>This ingredient is not used in any recipes</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-500">Current Unit Price</p>
                      <p className="text-lg font-bold text-gray-900">RM {costImpact.currentUnitPrice?.toFixed(4)}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">New Unit Price (+10%)</p>
                      <p className="text-lg font-bold text-orange-600">RM {costImpact.newUnitPrice?.toFixed(4)}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    <TrendingUp className="w-4 h-4 inline mr-1" />
                    Affects <strong>{costImpact.totalAffectedMenus}</strong> menu items
                  </p>
                  <div className="space-y-2">
                    {costImpact.affectedMenus?.map((menu: any) => (
                      <div key={menu.menuItemId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{menu.menuItemName}</p>
                          <p className="text-xs text-gray-500">
                            Cost: RM {menu.currentCost?.toFixed(2)} → RM {menu.newCost?.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${
                            menu.percentChange > 10 ? 'bg-red-100 text-red-700' : 
                            menu.percentChange > 5 ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            +{menu.percentChange?.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* HISTORY MODAL */}
      {modalType === 'history' && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900">Stock History: {selectedItem.name}</h3>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6">
              {adjustments.filter(a => a.inventoryItemId === selectedItem.id).length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <History className="w-8 h-8 mx-auto mb-2" />
                  <p>No adjustment history for this item</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {adjustments
                    .filter(a => a.inventoryItemId === selectedItem.id)
                    .map((adj) => (
                      <div key={adj.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            adj.type === 'MANUAL_IN' ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            {adj.type === 'MANUAL_IN' ? (
                              <Plus className="w-4 h-4 text-green-600" />
                            ) : (
                              <Minus className="w-4 h-4 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {adj.type === 'MANUAL_IN' ? '+' : '-'}{adj.quantity} {selectedItem.unitOfMeasure}
                            </p>
                            <p className="text-xs text-gray-500">{adj.reason}</p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">{new Date(adj.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};