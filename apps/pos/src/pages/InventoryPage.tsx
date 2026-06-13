// apps/pos/src/pages/InventoryPage.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Search, Plus, AlertTriangle, Package, History, X, Check, ArrowDownCircle,
} from 'lucide-react';
import type { InventoryItem, StockLog } from '@mat-ai/types';
import { usePOSStore } from '../stores/posStore';

const API_URL = import.meta.env.VITE_WS_URL || 'http://localhost:4000';

const categories = [
  { key: 'all', label: 'Semua' },
  { key: 'frozen', label: 'Frozen' },
  { key: 'chiller', label: 'Chiller' },
  { key: 'cheese', label: 'Cheese' },
  { key: 'vegetables', label: 'Vegetables' },
  { key: 'dry', label: 'Dry' },
  { key: 'sauce', label: 'Sauce' },
  { key: 'pasta', label: 'Pasta' },
  { key: 'oil', label: 'Oil' },
];

export const InventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentStaff } = usePOSStore();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [logs, setLogs] = useState<StockLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [stockQty, setStockQty] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch from backend
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await fetch(`${API_URL}/inventory/items`);
        if (res.ok) {
          const data = await res.json();
          setInventory(data);
          localStorage.setItem('mat-pos-inventory', JSON.stringify(data));
        } else {
          const saved = localStorage.getItem('mat-pos-inventory');
          if (saved) setInventory(JSON.parse(saved));
        }
      } catch (err) {
        console.error('Failed to fetch inventory:', err);
        const saved = localStorage.getItem('mat-pos-inventory');
        if (saved) setInventory(JSON.parse(saved));
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, []);

  // Fetch logs
  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/inventory/logs`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    }
  };

  const filteredItems = useMemo(() => {
    let items = inventory;
    if (activeCategory !== 'all') items = items.filter((i) => i.category === activeCategory);
    if (searchQuery) items = items.filter((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return items;
  }, [inventory, activeCategory, searchQuery]);

  const lowStockItems = useMemo(
    () => inventory.filter((item) => item.currentStock <= item.minStock),
    [inventory]
  );

  const openStockModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setStockQty('');
    setShowStockModal(true);
  };

  const handleStockIn = async () => {
    if (!selectedItem) return;
    const qty = parseFloat(stockQty);
    if (!qty || qty <= 0) {
      alert('Sila masukkan kuantiti');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/inventory/items/${selectedItem.id}/stock-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qty,
          staffId: currentStaff?.id || 'unknown',
          reason: 'Terima Stok',
        }),
      });

      if (!res.ok) throw new Error('Stock in failed');

      const result = await res.json();
      setInventory(prev => prev.map(item => item.id === selectedItem.id ? result.item : item));
      localStorage.setItem('mat-pos-inventory', JSON.stringify(
        inventory.map(item => item.id === selectedItem.id ? result.item : item)
      ));
      setShowStockModal(false);
    } catch (err) {
      console.error('Stock in failed:', err);
      alert('Gagal sync dengan server.');
    }
  };

  const getStatus = (item: InventoryItem) => {
    if (item.currentStock <= 0) return { label: 'HABIS', color: 'text-red-600', bg: 'bg-red-50 border-red-200' };
    if (item.currentStock <= item.minStock) return { label: 'KRITIKAL', color: 'text-red-600', bg: 'bg-red-50 border-red-200' };
    if (item.currentStock <= item.minStock * 2) return { label: 'RENDAH', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' };
    return { label: 'OK', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' };
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary-600" />
            <h1 className="font-bold text-gray-900">Terima Stok</h1>
          </div>
        </div>
        <button
          onClick={() => { setShowLogs(true); fetchLogs(); }}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          <History className="w-4 h-4" />
          Logs
        </button>
      </header>

      {lowStockItems.length > 0 && (
        <div className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2 shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            <strong>{lowStockItems.length}</strong> bahan stok rendah
          </p>
        </div>
      )}

      <div className="px-4 mt-4 shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                ${activeCategory === cat.key
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border hover:bg-gray-50'
                }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-3 shrink-0">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari bahan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mb-3" />
            <p className="text-sm">Loading inventory...</p>
          </div>
        ) : inventory.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Tiada bahan dalam inventory</p>
            <p className="text-sm">Import atau tambah bahan dalam Settings</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredItems.map((item) => {
              const status = getStatus(item);
              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-xl border p-4 shadow-sm ${status.bg}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">
                        {item.name}
                      </h3>
                      <p className="text-xs text-gray-500 uppercase">
                        {item.category} • {item.unit}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${status.bg} ${status.color}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Stok Sedia Ada</p>
                      <p className={`text-2xl font-bold ${status.color}`}>
                        {item.currentStock}
                      </p>
                      {item.weight && (
                        <p className="text-xs text-gray-400">
                          {item.weight}g / pack
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => openStockModal(item)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 active:scale-95 transition-all shadow-sm"
                    >
                      <ArrowDownCircle className="w-4 h-4" />
                      Stok In
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredItems.length === 0 && inventory.length > 0 && (
          <div className="text-center py-12 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Tiada bahan dijumpai</p>
          </div>
        )}
      </div>

      {/* Stock In Modal */}
      {showStockModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowStockModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Terima Stok</h3>
              <p className="text-sm text-gray-500">{selectedItem.name}</p>
            </div>
            <div className="p-6">
              <div className="mb-4 p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-xs text-gray-500">Stok Sedia Ada</p>
                <p className="text-2xl font-bold text-gray-900">
                  {selectedItem.currentStock} {selectedItem.unit}
                </p>
              </div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kuantiti Masuk ({selectedItem.unit})
              </label>
              <input
                type="number"
                value={stockQty}
                onChange={(e) => setStockQty(e.target.value)}
                placeholder="0"
                autoFocus
                className="w-full px-3 py-3 border rounded-xl text-lg text-center font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div className="flex gap-3 px-6 py-4 border-t bg-gray-50">
              <button
                onClick={() => setShowStockModal(false)}
                className="flex-1 py-3 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleStockIn}
                className="flex-1 py-3 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" /> Sahkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logs Modal */}
      {showLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowLogs(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <History className="w-5 h-5" />
                Sejarah Stok
              </h3>
              <button
                onClick={() => setShowLogs(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              {logs.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Tiada rekod</p>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        log.type === 'MANUAL_IN' ? 'bg-emerald-100' : 
                        log.type === 'AUTO_DEDUCT' ? 'bg-red-100' : 'bg-amber-100'
                      }`}>
                        {log.type === 'MANUAL_IN' ? <Plus className="w-4 h-4 text-emerald-600" /> :
                         log.type === 'AUTO_DEDUCT' ? <ArrowDownCircle className="w-4 h-4 text-red-600" /> :
                         <AlertTriangle className="w-4 h-4 text-amber-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {log.inventoryItem?.name || log.menuItem?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {log.type === 'MANUAL_IN' ? '+' : log.type === 'AUTO_DEDUCT' ? '-' : '~'}
                          {log.quantity} {log.reason}
                        </p>
                      </div>
                      <p className="text-xs text-gray-400">
                        {new Date(log.createdAt).toLocaleTimeString('ms-MY')}
                      </p>
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