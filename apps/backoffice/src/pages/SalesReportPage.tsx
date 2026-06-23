import { useEffect, useState, useCallback, useMemo } from 'react';
import { useApi } from '@mat-ai/backoffice';
import type { Order } from '@mat-ai/types';
import {
  TrendingUp, Calendar, RefreshCw, FileSpreadsheet,
  ChevronDown, ArrowUpDown,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

type Period = 'today' | 'week' | 'month' | 'custom';
type SortField = 'date' | 'item' | 'category' | 'paymentType' | 'receipt' | 'discount';
type SortDir = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  dir: SortDir;
}

interface SalesSummary {
  period: { from: string; to: string };
  summary: {
    totalSales: number;
    totalTax: number;
    orderCount: number;
    averageOrder: number;
  };
  orders: Order[];
}

interface ItemSales {
  name: string;
  quantity: number;
  revenue: number;
}

interface CategorySales {
  category: string;
  quantity: number;
  revenue: number;
}

interface PaymentSales {
  method: string;
  count: number;
  total: number;
}

interface HourlyBreakdown {
  hour: number;
  count: number;
  total: number;
}

export const SalesReportPage: React.FC = () => {
  const { get } = useApi();

  const [period, setPeriod] = useState<Period>('month');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Data states
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [salesByItem, setSalesByItem] = useState<ItemSales[]>([]);
  const [salesByCategory, setSalesByCategory] = useState<CategorySales[]>([]);
  const [salesByPayment, setSalesByPayment] = useState<PaymentSales[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyBreakdown[]>([]);

  const [sort, setSort] = useState<SortConfig>({ field: 'date', dir: 'desc' });
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const [chartType, setChartType] = useState<'area' | 'bar'>('area');

  // ── Resolve date range ──
  const resolveDates = useCallback(() => {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    let start = new Date(now);

    if (period === 'today') {
      start.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
    } else if (period === 'month') {
      start.setMonth(start.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
    } else if (period === 'custom' && dateRange.start && dateRange.end) {
      start = new Date(dateRange.start);
      start.setHours(0, 0, 0, 0);
      end.setTime(new Date(dateRange.end).getTime());
      end.setHours(23, 59, 59, 999);
    }

    return { start, end };
  }, [period, dateRange]);

  // ── Fetch all reports ──
  const fetchReports = useCallback(async (isManual = false) => {
    if (!isManual) setLoading(true);
    setError('');
    
    const { start, end } = resolveDates();
    const from = start.toISOString();
    const to = end.toISOString();

    try {
      const [
        summaryRes,
        itemRes,
        catRes,
        paymentRes,
        hourlyRes,
      ] = await Promise.all([
        get(`/reports/sales?from=${from}&to=${to}`),
        get(`/reports/sales/by-item?from=${from}&to=${to}`),
        get(`/reports/sales/by-category?from=${from}&to=${to}`),
        get(`/reports/sales/by-payment?from=${from}&to=${to}`),
        get(`/reports/sales/by-hour?from=${from}&to=${to}`),
      ]);

      if (summaryRes.ok) setSalesSummary(summaryRes.data as SalesSummary);
      if (itemRes.ok) setSalesByItem((itemRes.data as ItemSales[]) || []);
      if (catRes.ok) setSalesByCategory((catRes.data as CategorySales[]) || []);
      if (paymentRes.ok) setSalesByPayment((paymentRes.data as PaymentSales[]) || []);
      if (hourlyRes.ok) setHourlyData((hourlyRes.data as HourlyBreakdown[]) || []);

      setLastRefresh(new Date());
    } catch (err) {
      setError('Failed to load reports. Please try again.');
      console.error('Reports fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [get, resolveDates]);

  useEffect(() => {
    fetchReports();
  }, [period, dateRange]);

  // ── Chart data ──
  const chartData = useMemo(() => {
    return hourlyData.map(h => ({
      date: `${h.hour}:00`,
      revenue: h.total,
      orders: h.count,
    }));
  }, [hourlyData]);

  // ── Sorting ──
  const sortedOrders = useMemo(() => {
    if (!salesSummary?.orders) return [];
    const data = [...salesSummary.orders];
    
    data.sort((a, b) => {
      let valA: string | number, valB: string | number;
      switch (sort.field) {
        case 'date':
          valA = new Date(a.createdAt).getTime();
          valB = new Date(b.createdAt).getTime();
          break;
        case 'paymentType':
          valA = a.paymentMethod || '';
          valB = b.paymentMethod || '';
          break;
        case 'receipt':
          valA = a.orderNumber || '';
          valB = b.orderNumber || '';
          break;
        default:
          valA = new Date(a.createdAt).getTime();
          valB = new Date(b.createdAt).getTime();
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
  }, [salesSummary?.orders, sort]);

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

  // ── Export CSV via backend ──
  const handleExportCSV = async () => {
    const { start, end } = resolveDates();
    const from = start.toISOString();
    const to = end.toISOString();
    
    try {
      const res = await get(`/reports/sales/export?from=${from}&to=${to}`);
      if (res.ok && res.data) {
        // If backend returns string directly
        const blob = new Blob([res.data as string], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sales-report-${period}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export CSV');
    }
  };

  const timeAgo = () => {
    if (!lastRefresh) return 'Never';
    const diff = Math.floor((Date.now() - lastRefresh.getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff} min ago`;
    return lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const summary = salesSummary?.summary;

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
            onClick={() => fetchReports(true)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading...' : timeAgo()}
          </button>
          <button
            onClick={handleExportCSV}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
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
              onClick={() => fetchReports(true)}
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
          <p className="text-2xl font-bold text-gray-900">
            {summary ? `RM ${summary.totalSales.toFixed(2)}` : '—'}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-green-600" />
            <span className="text-sm text-gray-500">Total Orders</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {summary ? summary.orderCount : '—'}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-orange-600" />
            <span className="text-sm text-gray-500">Average Order</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {summary ? `RM ${summary.averageOrder.toFixed(2)}` : '—'}
          </p>
        </div>
      </div>

      {/* Sales by Category & Payment Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Sales by Category</h3>
          {salesByCategory.length > 0 ? (
            <div className="space-y-3">
              {salesByCategory.map((cat) => (
                <div key={cat.category} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{cat.category}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">{cat.quantity} sold</span>
                    <span className="text-sm font-medium text-gray-900">RM {cat.revenue.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No data</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Sales by Payment Method</h3>
          {salesByPayment.length > 0 ? (
            <div className="space-y-3">
              {salesByPayment.map((p) => (
                <div key={p.method} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{p.method}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">{p.count} txns</span>
                    <span className="text-sm font-medium text-gray-900">RM {p.total.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No data</p>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Sales Trend</h3>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setChartType('area')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                chartType === 'area' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              Area
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                chartType === 'bar' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              Bar
            </button>
          </div>
        </div>
        {chartData.length > 0 ? (
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
      </div>

      {/* Top Items */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Top Selling Items</h3>
        {salesByItem.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Item</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Quantity</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {salesByItem.map((item) => (
                  <tr key={item.name} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-900">{item.name}</td>
                    <td className="px-6 py-3 text-sm text-gray-500 text-right">{item.quantity}</td>
                    <td className="px-6 py-3 text-sm font-medium text-gray-900 text-right">RM {item.revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No data</p>
        )}
      </div>

      {/* Orders Table */}
      {loading && !salesSummary && (
        <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-200">
          <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
          <p>Loading sales data...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-8 text-red-500 bg-red-50 rounded-xl border border-red-200">
          <p>{error}</p>
          <button onClick={() => fetchReports(true)} className="mt-2 text-sm underline">Retry</button>
        </div>
      )}

      {!loading && !error && salesSummary?.orders && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Orders</h3>
            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200"
              >
                <ArrowUpDown className="w-4 h-4" />
                Sort: {sortLabels[sort.field]}
                <ChevronDown className={`w-4 h-4 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showSortDropdown && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-2">
                  {(Object.keys(sortLabels) as SortField[]).map((field) => (
                    <button
                      key={field}
                      onClick={() => toggleSort(field)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                        sort.field === field ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {sortLabels[field]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.orderNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700">
                        {order.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{(order as any).items?.length || 0} items</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                      RM{Number(order.totalAmount).toFixed(2)}
                    </td>
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