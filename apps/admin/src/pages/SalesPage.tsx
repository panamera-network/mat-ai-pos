// app/admin/src/pages/SalesPage.tsx
import { useEffect, useState, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { useSalesCache } from '../stores/salesCache';
import { Download, TrendingUp, Calendar, RefreshCw } from 'lucide-react';

type Period = 'today' | 'week' | 'month';

export function SalesPage() {
  const { get } = useApi();
  const cache = useSalesCache();

  const [period, setPeriod] = useState<Period>('today');
  const cached = cache.getData();
  const [sales, setSales] = useState<any[]>(cached?.orders || []);
  const [summary, setSummary] = useState(cached?.summary || { total: 0, count: 0, avg: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(
    cache.timestamp > 0 ? new Date(cache.timestamp) : null
  );

  const fetchSales = useCallback(async (isManual = false) => {
    if (!isManual) setLoading(true);
    setError('');
    try {
      const res = await get('/orders');
      if (!res.ok) {
        setError(`Failed to load: ${res.status}`);
        setLoading(false);
        return;
      }
      const orders = await res.json();

      const now = new Date();
      let filtered = orders;

      if (period === 'today') {
        const today = now.toISOString().split('T')[0];
        filtered = orders.filter((o: any) => o.createdAt?.startsWith(today));
      } else if (period === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = orders.filter((o: any) => new Date(o.createdAt) >= weekAgo);
      } else if (period === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = orders.filter((o: any) => new Date(o.createdAt) >= monthAgo);
      }

      const paidOrders = filtered.filter((o: any) => o.status === 'PAID');
      const total = paidOrders.reduce((sum: number, o: any) => sum + Number(o.totalAmount), 0);
      const newSummary = {
        total,
        count: paidOrders.length,
        avg: paidOrders.length > 0 ? total / paidOrders.length : 0,
      };

      setSales(paidOrders);
      setSummary(newSummary);
      cache.setData(paidOrders, newSummary, period);
      setLastRefresh(new Date());
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [period, get, cache]);

  useEffect(() => {
    if (cache.isExpired() || cached?.period !== period) {
      fetchSales();
    }
  }, [period, fetchSales, cache, cached]);

  const timeAgo = () => {
    if (!lastRefresh) return 'Never';
    const diff = Math.floor((Date.now() - lastRefresh.getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff} min ago`;
    return lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Sales Report</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchSales(true)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading...' : timeAgo()}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        {(['today', 'week', 'month'] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 sm:flex-none sm:px-6 py-2 rounded-xl text-sm font-medium transition-colors ${
              period === p ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {loading && sales.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
          <p>Loading sales data...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-8 text-red-500 bg-red-50 rounded-xl">
          <p>{error}</p>
          <button onClick={() => fetchSales(true)} className="mt-2 text-sm underline">Retry</button>
        </div>
      )}

      {!loading && !error && sales.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Calendar className="w-8 h-8 mx-auto mb-2" />
          <p>No sales data for this period</p>
        </div>
      )}

      {sales.length > 0 && (
        <>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-500">Revenue</span>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-gray-900">RM{summary.total.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-500">Orders</span>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-gray-900">{summary.count}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-orange-600" />
                <span className="text-sm text-gray-500">Average</span>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-gray-900">RM{summary.avg.toFixed(2)}</p>
            </div>
          </div>

          <div className="md:hidden space-y-2">
            {sales.slice(0, 30).map((order: any) => (
              <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm text-gray-900">{order.orderNumber}</p>
                  <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleTimeString()}</p>
                </div>
                <span className="font-bold text-gray-900">RM{Number(order.totalAmount).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Order #</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Time</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Type</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Items</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sales.map((order: any) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.orderNumber}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700">
                          {order.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{order.items?.length || 0} items</td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                        RM{Number(order.totalAmount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}