import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '@mat-ai/backoffice';
import { ArrowLeft, AlertTriangle, Package, ArrowDown, ArrowUp, RefreshCw } from 'lucide-react';

type InvTab = 'alerts' | 'all' | 'logs';

export function InventoryPage() {
  const navigate = useNavigate();
  const { get } = useApi();
  const [inventory, setInventory] = useState<any[]>([]);
  const [stockLogs, setStockLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<InvTab>('alerts');
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [invRes, logsRes] = await Promise.all([
          get('/inventory/items'),
          get('/inventory/logs?limit=50'),
        ]);
        if (invRes.ok) setInventory((invRes.data as any[]) || []);
        if (logsRes.ok) setStockLogs((logsRes.data as any[]) || []);
        setLastRefresh(new Date());
      } catch (err) {
        console.error('Inventory fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [get]);

  const lowStock = inventory.filter((i) => i.currentStock <= i.minStock);

  const timeAgo = () => {
    if (!lastRefresh) return 'Never';
    const diff = Math.floor((Date.now() - lastRefresh.getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff} min ago`;
    return lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-gray-700" /></button>
          <h1 className="font-bold text-gray-900">Inventory</h1>
        </div>
        <button onClick={() => window.location.reload()} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-600 hover:bg-gray-200 disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />{loading ? 'Loading...' : timeAgo()}
        </button>
      </header>
      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div className="flex gap-2">
          {(['alerts', 'all', 'logs'] as InvTab[]).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 sm:flex-none sm:px-6 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === t ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
          ))}
        </div>
        {activeTab === 'alerts' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {lowStock.length === 0 ? (
              <div className="text-center py-16 text-gray-400"><Package className="w-12 h-12 mx-auto mb-2" /><p>All stock levels healthy</p></div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200"><tr><th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Item</th><th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Category</th><th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Current</th><th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Min</th><th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {lowStock.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-500" />{item.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{item.category}</td>
                      <td className="px-6 py-4 text-sm font-bold text-orange-600 text-right">{item.currentStock}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 text-right">{item.minStock}</td>
                      <td className="px-6 py-4"><span className="inline-flex px-2 py-1 rounded-lg text-xs font-medium bg-orange-100 text-orange-700">Low</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
        {activeTab === 'all' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200"><tr><th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Item</th><th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Category</th><th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Stock</th><th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Min</th><th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Cost</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {inventory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.category}</td>
                    <td className={`px-6 py-4 text-sm font-bold text-right ${item.currentStock <= item.minStock ? 'text-orange-600' : 'text-green-600'}`}>{item.currentStock}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 text-right">{item.minStock}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">RM{item.costPerUnit?.toFixed(2) || '-'}</td>
                  </tr>
                ))}
                {inventory.length === 0 && !loading && <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400"><Package className="w-8 h-8 mx-auto mb-2" /><p>No inventory items</p></td></tr>}
              </tbody>
            </table>
          </div>
        )}
        {activeTab === 'logs' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200"><tr><th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Type</th><th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Item</th><th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Date</th><th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Qty</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {stockLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4"><span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${log.type === 'AUTO_DEDUCT' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{log.type === 'AUTO_DEDUCT' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}{log.type.replace('_', ' ')}</span></td>
                    <td className="px-6 py-4 text-sm text-gray-900">{log.inventoryItem?.name || log.menuItem?.name || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm font-bold text-right text-gray-900">{log.quantity}</td>
                  </tr>
                ))}
                {stockLogs.length === 0 && !loading && <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400"><p>No stock logs</p></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}