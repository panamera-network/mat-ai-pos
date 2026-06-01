// apps/pos/src/pages/InventoryPage.tsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Plus,
  AlertTriangle,
  Package,
  History,
  X,
  Check,
  ArrowDownCircle,
} from 'lucide-react';

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  weight: number;
  open: number;
  in: number;
  out: number;
  close: number;
}

interface StockLog {
  id: string;
  itemName: string;
  qty: number;
  previousClose: number;
  newClose: number;
  timestamp: string;
}

const initialInventory: InventoryItem[] = [
  { id: 1, name: 'AYAM BB', category: 'frozen', weight: 1000, open: 0, in: 0, out: 0, close: 0 },
  { id: 2, name: 'KEPAK AYAM', category: 'frozen', weight: 1000, open: 0, in: 0, out: 0, close: 0 },
  { id: 3, name: 'DAGING CINCANG', category: 'frozen', weight: 1000, open: 0, in: 0, out: 0, close: 0 },
  { id: 4, name: 'BEEF PEPPERONI', category: 'frozen', weight: 1000, open: 0, in: 0, out: 2025, close: 0 },
  { id: 5, name: 'CHICKEN PEPPERONI', category: 'frozen', weight: 1000, open: 0, in: 0, out: 1483, close: 0 },
  { id: 6, name: 'BEEF SALAMI', category: 'frozen', weight: 1000, open: 0, in: 0, out: 425, close: 0 },
  { id: 7, name: 'SOSEJ', category: 'frozen', weight: 340, open: 0, in: 0, out: 1316, close: 0 },
  { id: 8, name: 'STREAKY BEEF', category: 'frozen', weight: 1000, open: 0, in: 0, out: 805, close: 0 },
  { id: 9, name: 'LAMB - PROCESS', category: 'frozen', weight: 1000, open: 0, in: 0, out: 560, close: 0 },
  { id: 10, name: 'CHICKEN CHOP', category: 'frozen', weight: 2, open: 0, in: 0, out: 22, close: 0 },
  { id: 11, name: 'UDANG', category: 'frozen', weight: 1000, open: 0, in: 0, out: 2162, close: 0 },
  { id: 12, name: 'SOTONG', category: 'frozen', weight: 1000, open: 0, in: 0, out: 582, close: 0 },
  { id: 13, name: 'CRAB STICK', category: 'frozen', weight: 500, open: 0, in: 0, out: 264, close: 0 },
  { id: 14, name: 'CHICKEN SLICE', category: 'frozen', weight: 500, open: 0, in: 0, out: 270, close: 0 },
  { id: 15, name: 'SHRIMP', category: 'frozen', weight: 24, open: 0, in: 0, out: 9, close: 0 },
  { id: 16, name: 'LOBSTER', category: 'frozen', weight: 10, open: 0, in: 0, out: 0, close: 0 },
  { id: 17, name: 'BEEF MEAT BALL', category: 'frozen', weight: 1000, open: 0, in: 0, out: 72, close: 0 },
  { id: 18, name: 'DRUMMET AYAM GIANT', category: 'frozen', weight: 850, open: 0, in: 0, out: 36, close: 0 },
  { id: 19, name: 'CHICKEN POPCORN', category: 'frozen', weight: 1000, open: 0, in: 0, out: 0, close: 0 },
  { id: 20, name: 'SHOESTRING FRIES', category: 'frozen', weight: 1000, open: 0, in: 0, out: 8600, close: 0 },
  { id: 21, name: 'CURLY FRIES', category: 'frozen', weight: 1000, open: 0, in: 0, out: 4000, close: 0 },
  { id: 22, name: 'MOZZARELLA CHEESE', category: 'cheese', weight: 1000, open: 0, in: 0, out: 34678, close: 0 },
  { id: 23, name: 'CHEDDAR SHREDDED', category: 'cheese', weight: 1000, open: 0, in: 0, out: 90, close: 0 },
  { id: 24, name: 'PARMESAN', category: 'cheese', weight: 1000, open: 0, in: 0, out: 6, close: 0 },
  { id: 25, name: 'CHEDDAR COLOUR', category: 'cheese', weight: 1000, open: 0, in: 0, out: 204, close: 0 },
  { id: 26, name: 'FETA', category: 'cheese', weight: 200, open: 0, in: 0, out: 84, close: 0 },
  { id: 27, name: 'TOMATO CHERRY', category: 'vegetables', weight: 200, open: 0, in: 0, out: 646, close: 0 },
  { id: 28, name: 'BASIL', category: 'vegetables', weight: 10, open: 0, in: 0, out: 24, close: 0 },
  { id: 29, name: 'CAPSICUM', category: 'vegetables', weight: 1000, open: 0, in: 0, out: 2822, close: 0 },
  { id: 30, name: 'MUSHROOM', category: 'vegetables', weight: 210, open: 0, in: 0, out: 738, close: 0 },
  { id: 31, name: 'CILI PAID MERAH', category: 'vegetables', weight: 1000, open: 0, in: 0, out: 102, close: 0 },
  { id: 32, name: 'BAWANG PUTIH', category: 'vegetables', weight: 1000, open: 0, in: 0, out: 202, close: 0 },
  { id: 33, name: 'BAWANG MERAH', category: 'dry', weight: 1000, open: 0, in: 0, out: 2605, close: 0 },
  { id: 34, name: 'NENAS', category: 'dry', weight: 1000, open: 0, in: 0, out: 2751, close: 0 },
  { id: 35, name: 'SPAGHETTI', category: 'pasta', weight: 500, open: 0, in: 0, out: 14670, close: 0 },
  { id: 36, name: 'LASAGNE', category: 'pasta', weight: 500, open: 0, in: 0, out: 30, close: 0 },
  { id: 37, name: 'OLIVE OIL', category: 'oil', weight: 1000, open: 0, in: 0, out: 980, close: 0 },
  { id: 38, name: 'FULL CREAM MILK', category: 'dry', weight: 1000, open: 0, in: 0, out: 1845, close: 0 },
  { id: 39, name: 'GARAM - BM', category: 'dry', weight: 1000, open: 0, in: 0, out: 6, close: 0 },
  { id: 40, name: 'GULA - BM', category: 'dry', weight: 1000, open: 0, in: 0, out: 30, close: 0 },
  { id: 41, name: 'TUNA', category: 'dry', weight: 160, open: 0, in: 0, out: 720, close: 0 },
  { id: 42, name: 'BLACK OLIVE', category: 'dry', weight: 170, open: 0, in: 0, out: 195, close: 0 },
  { id: 43, name: 'BBQ SOS KIMBALL', category: 'sauce', weight: 1000, open: 0, in: 0, out: 600, close: 0 },
  { id: 44, name: 'THOUSAND ISLAND SOS', category: 'sauce', weight: 1000, open: 0, in: 0, out: 1056, close: 0 },
  { id: 45, name: 'LEGOS CARBONARA', category: 'sauce', weight: 490, open: 0, in: 0, out: 1800, close: 0 },
  { id: 46, name: 'BEEF STOCK', category: 'sauce', weight: 1500, open: 0, in: 0, out: 33, close: 0 },
  { id: 47, name: 'STOK UDANG', category: 'sauce', weight: 1, open: 0, in: 0, out: 114, close: 0 },
  { id: 48, name: 'BUTTER', category: 'chiller', weight: 250, open: 0, in: 0, out: 90, close: 0 },
  { id: 49, name: 'BROCCOLI', category: 'vegetables', weight: 1000, open: 0, in: 0, out: 1100, close: 0 },
  { id: 50, name: 'CARROT', category: 'vegetables', weight: 1000, open: 0, in: 0, out: 0, close: 0 },
];

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

const getComputedClose = (item: InventoryItem): number => {
  return item.close || (item.open + item.in - item.out);
};

const getStatus = (close: number) => {
  if (close <= 0) return { label: 'HABIS', color: 'text-red-600', bg: 'bg-red-50 border-red-200' };
  if (close < 50) return { label: 'KRITIKAL', color: 'text-red-600', bg: 'bg-red-50 border-red-200' };
  if (close < 100) return { label: 'RENDAH', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' };
  return { label: 'OK', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' };
};

export const InventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [logs, setLogs] = useState<StockLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [stockQty, setStockQty] = useState('');

  const filteredItems = useMemo(() => {
    let items = inventory;
    if (activeCategory !== 'all') items = items.filter((i) => i.category === activeCategory);
    if (searchQuery) items = items.filter((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return items;
  }, [inventory, activeCategory, searchQuery]);

  const lowStockItems = useMemo(() => inventory.filter((item) => getComputedClose(item) < 100), [inventory]);

  const openStockModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setStockQty('');
    setShowStockModal(true);
  };

  const handleStockIn = () => {
    if (!selectedItem) return;
    const qty = parseFloat(stockQty);
    if (!qty || qty <= 0) {
      alert('Sila masukkan kuantiti');
      return;
    }

    const prevClose = getComputedClose(selectedItem);
    const newItem = { ...selectedItem, in: selectedItem.in + qty };

    setInventory((prev) => prev.map((item) => (item.id === selectedItem.id ? newItem : item)));

    setLogs((prev) => [
      {
        id: crypto.randomUUID(),
        itemName: selectedItem.name,
        qty,
        previousClose: prevClose,
        newClose: prevClose + qty,
        timestamp: new Date().toLocaleTimeString('ms-MY'),
      },
      ...prev,
    ]);

    setShowStockModal(false);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary-600" />
            <h1 className="font-bold text-gray-900">Terima Stok</h1>
          </div>
        </div>
        <button
          onClick={() => setShowLogs(true)}
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
                ${activeCategory === cat.key ? 'bg-primary-600 text-white shadow-md' : 'bg-white text-gray-700 border hover:bg-gray-50'}`}
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
        <div className="grid grid-cols-2 gap-3">
          {filteredItems.map((item) => {
            const close = getComputedClose(item);
            const status = getStatus(close);
            return (
              <div
                key={item.id}
                className={`bg-white rounded-xl border p-4 shadow-sm ${status.bg}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">{item.name}</h3>
                    <p className="text-xs text-gray-500 uppercase">{item.category}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${status.bg} ${status.color}`}>
                    {status.label}
                  </span>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Stok Sedia Ada</p>
                    <p className={`text-2xl font-bold ${status.color}`}>{close}</p>
                    <p className="text-xs text-gray-400">{item.weight}g / pack</p>
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

        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Tiada bahan dijumpai</p>
          </div>
        )}
      </div>

      {showStockModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowStockModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Terima Stok</h3>
              <p className="text-sm text-gray-500">{selectedItem.name}</p>
            </div>
            <div className="p-6">
              <div className="mb-4 p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-xs text-gray-500">Stok Sedia Ada</p>
                <p className="text-2xl font-bold text-gray-900">{getComputedClose(selectedItem)}</p>
              </div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kuantiti Masuk (g/unit)</label>
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

      {showLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowLogs(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <History className="w-5 h-5" />
                Sejarah Stok Masuk
              </h3>
              <button onClick={() => setShowLogs(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              {logs.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Tiada rekod</p>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <Plus className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{log.itemName}</p>
                        <p className="text-xs text-gray-500">
                          +{log.qty} • {log.previousClose} → {log.newClose}
                        </p>
                      </div>
                      <p className="text-xs text-gray-400">{log.timestamp}</p>
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