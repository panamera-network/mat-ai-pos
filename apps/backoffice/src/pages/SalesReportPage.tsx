import { useEffect, useState, useCallback, useMemo } from 'react';
import { useApi, useSalesCache } from '@mat-ai/backoffice';
import type {
  Order,
  OrderView,
  OrderStatus,
  OrderType,
  PaymentMethod,
  AppliedDiscount,
  DiscountType,
  SalesSummary,
  OrderItem,  // ← tambah ni dalam global types
} from '@mat-ai/types';
import {
  Download, TrendingUp, Calendar, RefreshCw, FileSpreadsheet,
  Filter, ChevronDown, ArrowUpDown
} from 'lucide-react';
import { ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, 
  BarChart,
  AreaChart} from 'recharts';

type Period = 'today' | 'week' | 'month' | 'custom';
type SortField = 'date' | 'item' | 'category' | 'paymentType' | 'receipt' | 'discount';
type SortDir = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  dir: SortDir;
}

// Helper type untuk API response
type ApiOrder = Order & {
  discountAmount?: number;
  discount?: AppliedDiscount;
  items?: OrderItem[];
};

export const SalesReportPage: React.FC = () => {
  const { get } = useApi();
  const cache = useSalesCache();

  const [period, setPeriod] = useState<Period>('today');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const cached = cache.getData();
  const [sales, setSales] = useState<ApiOrder[]>(cached?.orders || []);
  const [summary, setSummary] = useState<SalesSummary>(
    cached?.summary || { total: 0, count: 0, avg: 0 }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(
    cache.timestamp > 0 ? new Date(cache.timestamp) : null
  );

  const [sort, setSort] = useState<SortConfig>({ field: 'date', dir: 'desc' });
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Mock discounts — guna AppliedDiscount type
  const [discounts] = useState<AppliedDiscount[]>([
    { type: 'percentage', value: 10, reason: 'Early Bird', amount: 0 },
    { type: 'percentage', value: 5, reason: 'Member Discount', amount: 0 },
    { type: 'fixed', value: 5, reason: 'Weekend Special', amount: 5 },
  ]);

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
      const orders = (res.data || []) as ApiOrder[];

      const now = new Date();
      let filtered: ApiOrder[] = orders;

      if (period === 'today') {
        const today = now.toISOString().split('T')[0];
        filtered = orders.filter((o) => o.createdAt?.startsWith(today));
      } else if (period === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = orders.filter((o) => new Date(o.createdAt) >= weekAgo);
      } else if (period === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = orders.filter((o) => new Date(o.createdAt) >= monthAgo);
      } else if (period === 'custom' && dateRange.start && dateRange.end) {
        filtered = orders.filter((o) => {
          const d = new Date(o.createdAt);
          return d >= new Date(dateRange.start) && d <= new Date(dateRange.end);
        });
      }

      const paidOrders = filtered.filter((o) => o.status === 'PAID');
      const total = paidOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
      const newSummary: SalesSummary = {
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

  // Sorting logic — dah typed
  const sortedSales = useMemo(() => {
    const data = [...sales];
    data.sort((a, b) => {
      let valA: string | number, valB: string | number;
      switch (sort.field) {
        case 'date':
          valA = new Date(a.createdAt).getTime();
          valB = new Date(b.createdAt).getTime();
          break;
        case 'item':
          valA = a.items?.[0]?.name || '';
          valB = b.items?.[0]?.name || '';
          break;
        case 'category':
          valA = a.items?.[0]?.menuItem?.category?.name || '';
          valB = b.items?.[0]?.menuItem?.category?.name || '';
          break;
        case 'paymentType':
          valA = a.paymentMethod || '';
          valB = b.paymentMethod || '';
          break;
        case 'receipt':
          valA = a.orderNumber || '';
          valB = b.orderNumber || '';
          break;
        case 'discount':
          valA = a.discountAmount || a.discount?.amount || 0;
          valB = b.discountAmount || b.discount?.amount || 0;
          break;
        default:
          valA = a.createdAt;
          valB = b.createdAt;
      }
      if (typeof valA === 'string') {
        return sort.dir === 'asc'
          ? valA.localeCompare(valB as string)
          : (valB as string).localeCompare(valA);
      }
      return sort.dir === 'asc'
        ? (valA as number) - (valB as number)
        : (valB as number) - (valA as number);
    });
    return data;
  }, [sales, sort]);

  const toggleSort = (field: SortField) => {
    setSort((prev) => ({
      field,
      dir: prev.field === field && prev.dir === 'asc' ? 'desc' : 'asc',
    }));
    setShowSortDropdown(false);
  };

  const sortLabels: Record<SortField, string> = {
    date: 'Date',
    item: 'Item',
    category: 'Category',
    paymentType: 'Payment Type',
    receipt: 'Receipt #',
    discount: 'Discount',
  };

  // Generate chart data dari sales
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const chartData = useMemo(() => {
    // Group by date
    const grouped = new Map<string, { date: string; revenue: number; orders: number }>();
    
    sortedSales.forEach((order) => {
      const date = new Date(order.createdAt).toLocaleDateString('en-MY', { 
        day: 'numeric', 
        month: 'short' 
      });
      const existing = grouped.get(date);
      if (existing) {
        existing.revenue += Number(order.totalAmount);
        existing.orders += 1;
      } else {
        grouped.set(date, { date, revenue: Number(order.totalAmount), orders: 1 });
      }
    });

    // Convert to array, sort by date
    return Array.from(grouped.values()).sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });
  }, [sortedSales]);

  const handleExportCSV = () => {
    const headers = ['Order #', 'Date', 'Type', 'Items', 'Total', 'Payment Method', 'Discount'];
    const rows = sortedSales.map((o) => [
      o.orderNumber,
      new Date(o.createdAt).toLocaleString(),
      o.type,
      o.items?.length || 0,
      o.totalAmount,
      o.paymentMethod || '-',
      o.discountAmount || o.discount?.amount || 0,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
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

      {/* Sort Dropdown */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            <ArrowUpDown className="w-4 h-4" />
            Sort by: {sortLabels[sort.field]} ({sort.dir === 'asc' ? 'A-Z' : 'Z-A'})
            <ChevronDown className={`w-4 h-4 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
          </button>
          {showSortDropdown && (
            <div className="absolute left-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-2">
              {(Object.keys(sortLabels) as SortField[]).map((field) => (
                <button
                  key={field}
                  onClick={() => toggleSort(field)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    sort.field === field ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{sortLabels[field]}</span>
                    {sort.field === field && (
                      <span className="text-xs text-blue-600">{sort.dir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <span className="text-sm text-gray-500">{sortedSales.length} orders</span>
      </div>

      {/* Sales Trend Chart */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Sales Trend</h3>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setChartType('area')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              chartType === 'area' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Area
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              chartType === 'bar' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Bar
          </button>
        </div>
      </div>

        {sortedSales.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            {chartType === 'area' ? (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v: number) => `RM${v}`} />
                <Tooltip 
                  formatter={(value: number) => [`RM${value.toFixed(2)}`, 'Revenue']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} fill="url(#colorSales)" />
              </AreaChart>
            ) : (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v: number) => `RM${v}`} />
                <Tooltip 
                  formatter={(value: number) => [`RM${value.toFixed(2)}`, 'Revenue']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                />
                <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="h-72 bg-gray-50 rounded-lg flex items-center justify-center border border-dashed border-gray-300">
            <p className="text-gray-400">No data to display</p>
          </div>
        )}
      

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

      {sortedSales.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Order #</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Items</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Total</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Payment</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Discount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedSales.map((order: any) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.orderNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700">{order.type}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{order.items?.length || 0} items</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">RM{Number(order.totalAmount).toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{order.paymentMethod || '-'}</td>
                    <td className="px-6 py-4 text-sm text-right">
                      {order.discountAmount ? (
                        <span className="text-green-600 font-medium">-RM{Number(order.discountAmount).toFixed(2)}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
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