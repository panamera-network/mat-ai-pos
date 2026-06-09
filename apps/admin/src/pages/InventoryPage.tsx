// app/admin/src/pages/InventoryPage.tsx
import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { AlertTriangle, Package, ArrowDown, ArrowUp } from 'lucide-react';

type InvTab = 'alerts' | 'all' | 'logs';

export function InventoryPage() {
  const { get } = useApi();
  const [inventory, setInventory] = useState<any[]>([]);
  const [stockLogs, setStockLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<InvTab>('alerts');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invRes, logsRes] = await Promise.all([
          get('/inventory/items'),
          get('/inventory/logs?limit=50'),
        ]);
        if (invRes.ok) setInventory(await invRes.json());
        if (logsRes.ok) setStockLogs(await logsRes.json());
      } catch (err) {
        console.error('Inventory fetch error:', err);
      }
    };
    fetchData();
  }, [get]);

  const lowStock = inventory.filter((i) => i.currentStock <= i.minStock);

  return (
    <div className="space-y-4 md:space-y-6">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900">Inventory</h1>

      <div className="flex gap-2">
        {(['alerts', 'all', 'logs'] as InvTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex-1 sm:flex-none sm:px-6 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === t ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'alerts' && (
        <>
          <div className="md:hidden space-y-2">
            {lowStock.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Package className="w-12 h-12 mx-auto mb-2" />
                <p className="text-sm">All stock levels healthy</p>
              </div>
            ) : (
              lowStock.map((item) => (
                <div key={item.id} className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-600">{item.category} • {item.unit}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-orange-700">{item.currentStock} / {item.minStock}</p>
                      <p className="text-xs text-orange-600">Low stock</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {lowStock.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Package className="w-12 h-12 mx-auto mb-2" />
                <p>All stock levels healthy</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Item</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Category</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Unit</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Current</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Min</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lowStock.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{item.category}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{item.unit}</td>
                      <td className="px-6 py-4 text-sm font-bold text-orange-600 text-right">{item.currentStock}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 text-right">{item.minStock}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 rounded-lg text-xs font-medium bg-orange-100 text-orange-700">Low</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {activeTab === 'all' && (
        <>
          <div className="md:hidden space-y-2">
            {inventory.map((item) => (
              <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.category} • {item.unit}</p>
                </div>
                <span className={`text-sm font-bold ${item.currentStock <= item.minStock ? 'text-orange-600' : 'text-green-600'}`}>{item.currentStock}</span>
              </div>
            ))}
          </div>

          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Item</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Category</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Unit</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Stock</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Min</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inventory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.category}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.unit}</td>
                    <td className="px-6 py-4 text-sm font-bold text-right text-gray-900">{item.currentStock}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 text-right">{item.minStock}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">RM{item.costPerUnit?.toFixed(2) || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'logs' && (
        <>
          <div className="md:hidden space-y-2">
            {stockLogs.map((log) => (
              <div key={log.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{log.type}</p>
                    <p className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={`text-sm font-bold ${log.type === 'AUTO_DEDUCT' ? 'text-red-600' : 'text-green-600'}`}>
                    {log.type === 'AUTO_DEDUCT' ? '-' : '+'}{log.quantity}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Item</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Reason</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stockLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${log.type === 'AUTO_DEDUCT' ? 'bg-red-100 text-red-700' : log.type === 'MANUAL_IN' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {log.type === 'AUTO_DEDUCT' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
                        {log.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{log.inventoryItem?.name || log.menuItem?.name || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{log.reason || '-'}</td>
                    <td className="px-6 py-4 text-sm font-bold text-right text-gray-900">{log.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}