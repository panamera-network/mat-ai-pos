import { useEffect, useState, useCallback } from 'react';
import { useApi, useSalesCache } from '@mat-ai/backoffice';
import {
  Download, TrendingUp, Calendar, RefreshCw, FileSpreadsheet,
  Filter, ChevronDown
} from 'lucide-react';

type Period = 'today' | 'week' | 'month' | 'custom';

export const SalesReportPage: React.FC = () => {
  const { get } = useApi();
  const cache = useSalesCache();

  const [period, setPeriod] = useState<Period>('today');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
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
      const orders = (res.data || []) as any[];

      const now = new Date();
      let filtered: any[] = orders;

      if (period === 'today') {
        const today = now.toISOString().split('T')[0];
        filtered = orders.filter((o: any) => o.createdAt?.startsWith(today));
      } else if (period === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = orders.filter((o: any) => new Date(o.createdAt) >= weekAgo);
      } else if (period === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = orders.filter((o: any) => new Date(o.createdAt) >= monthAgo);
      } else if (period === 'custom' && dateRange.start && dateRange.end) {
        filtered = orders.filter((o: any) => {
          const d = new Date(o.createdAt);
          return d >= new Date(dateRange.start) && d <= new Date(dateRange.end);
        });
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
  }, [period, dateRange, get, cache]);

  useEffect(() => {
    if (cache.isExpired() || cached?.period !== period) {
      fetchSales();
    }
  }, [period, fetchSales, cache, cached]);

  const handleExportCSV = () => {
    const headers = ['Order #', 'Date', 'Type', 'Items', 'Total', 'Payment Method'];
    const rows = sales.map((o: any) => [
      o.orderNumber,
      new Date(o.createdAt).toLocaleString(),
      o.type,
      o.items?.length || 0,
      o.totalAmount,
      o.paymentMethod,
    ]);
    const csv = [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const timeAgo = () => {
    if (!lastRefresh) return 'Never';
    const diff = Math.floor((Date.now() - lastRefresh.getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff} min ago`;
    return lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Report</h1>
          <p className="text-sm text-gray-500 mt-1">Track revenue and order performance</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchSales(true)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading...' : timeAgo()}
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Period Filter */}
      <div className="flex items-center gap-3">
        <div className="flex bg-white border rounded-lg p-1">
          {(['today', 'week', 'month', 'custom'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                period === p ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : 'Custom'}
            </button>
          ))}
        </div>
        {period === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm"
            />
            <button
              onClick={() => fetchSales(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-gray-500">Total Revenue</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">RM{summary.total.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-green-600" />
            <span className="text-sm text-gray-500">Total Orders</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{summary.count}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-orange-600" />
            <span className="text-sm text-gray-500">Average Order</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">RM{summary.avg.toFixed(2)}</p>
        </div>
      </div>

      {/* Chart Placeholder */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Sales Trend</h3>
        <div className="h-72 bg-gray-50 rounded-lg flex items-center justify-center border border-dashed border-gray-300">
          <p className="text-gray-400">Sales trend chart will be rendered here (recharts/plotly)</p>
        </div>
      </div>

      {/* Orders Table */}
      {loading && sales.length === 0 && (
        <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-200">
          <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
          <p>Loading sales data...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-8 text-red-500 bg-red-50 rounded-xl border border-red-200">
          <p>{error}</p>
          <button onClick={() => fetchSales(true)} className="mt-2 text-sm underline">Retry</button>
        </div>
      )}

      {!loading && !error && sales.length === 0 && (
        <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-200">
          <Calendar className="w-8 h-8 mx-auto mb-2" />
          <p>No sales data for this period</p>
        </div>
      )}

      {sales.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Order #</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Time</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Items</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Total</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sales.map((order: any) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.orderNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700">{order.type}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{order.items?.length || 0} items</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">RM{Number(order.totalAmount).toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{order.paymentMethod || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
