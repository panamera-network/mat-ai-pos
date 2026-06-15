import { useEffect, useState, useCallback } from 'react';
import { useApi } from '@mat-ai/backoffice';
import {
  AlertTriangle, Package, TrendingDown, RefreshCw, Plus,
  Search, Filter, ArrowUpDown, History
} from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const { get, patch } = useApi();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'category'>('name');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get('/menu-items');
      if (res.ok) setItems((res.data as any[]) || []);
    } catch (err) {
      console.error('Inventory fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [get]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleAdjustStock = async (id: string, newStock: number) => {
    await patch(`/menu-items/${id}`, { stock: newStock });
    setItems(prev => prev.map(i => i.id === id ? { ...i, stock: newStock } : i));
  };

  const filteredItems = items
    .filter(item => {
      if (filter === 'low') return (item.stock ?? 0) < (item.minStock ?? 0) && (item.stock ?? 0) > 0;
      if (filter === 'out') return (item.stock ?? 0) === 0;
      return true;
    })
    .filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.categoryId && item.categoryId.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'stock') return (a.stock ?? 0) - (b.stock ?? 0);
      return 0;
    });

  const lowStockCount = items.filter(i => (i.stock ?? 0) < (i.minStock ?? 0) && (i.stock ?? 0) > 0).length;
  const outOfStockCount = items.filter(i => (i.stock ?? 0) === 0).length;
  const totalItems = items.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">Track stock levels and manage inventory</p>
        </div>
        <button
          onClick={() => fetchItems()}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Total Items</p>
          <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Low Stock</p>
          <p className="text-2xl font-bold text-orange-600">{lowStockCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Out of Stock</p>
          <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search inventory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div className="flex bg-white border rounded-lg p-1">
          {(['all', 'low', 'out'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === f ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f === 'all' ? 'All' : f === 'low' ? 'Low Stock' : 'Out of Stock'}
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-2 bg-white border rounded-lg text-sm"
        >
          <option value="name">Sort by Name</option>
          <option value="stock">Sort by Stock</option>
        </select>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Item</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Category</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Current Stock</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Min Stock</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredItems.map((item) => {
              const stock = item.stock ?? 0;
              const minStock = item.minStock ?? 0;
              const isLow = stock < minStock && stock > 0;
              const isOut = stock === 0;
              return (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.categoryId || '-'}</td>
                  <td className="px-6 py-4 text-sm text-right">
                    <span className={`font-medium ${isOut ? 'text-red-600' : isLow ? 'text-orange-600' : 'text-gray-900'}`}>
                      {stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 text-right">{minStock}</td>
                  <td className="px-6 py-4">
                    {isOut ? (
                      <span className="inline-flex px-2 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-700">Out of Stock</span>
                    ) : isLow ? (
                      <span className="inline-flex px-2 py-1 rounded-lg text-xs font-medium bg-orange-100 text-orange-700">Low Stock</span>
                    ) : (
                      <span className="inline-flex px-2 py-1 rounded-lg text-xs font-medium bg-green-100 text-green-700">OK</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <input
                        type="number"
                        defaultValue={stock}
                        onBlur={(e) => handleAdjustStock(item.id, parseInt(e.target.value) || 0)}
                        className="w-20 px-2 py-1 border rounded text-sm text-right"
                      />
                      <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600">
                        <History className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredItems.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                  <Package className="w-8 h-8 mx-auto mb-2" />
                  <p>No inventory items found</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
