// apps/backoffice/src/pages/DashboardPage.tsx
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useApi } from '@mat-ai/backoffice';
import {
  TrendingUp, TrendingDown, Users, Receipt, DollarSign,
  Package, AlertTriangle, Calendar,
  Clock, UserCheck, UserX, ChevronDown,
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ElementType;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, trend, icon: Icon, color }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <div className="flex items-center gap-1 mt-3">
      {trend === 'up' ? (
        <TrendingUp className="w-4 h-4 text-green-500" />
      ) : (
        <TrendingDown className="w-4 h-4 text-red-500" />
      )}
      <span className={`text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
        {change}
      </span>
      <span className="text-sm text-gray-400">vs last month</span>
    </div>
  </div>
);

interface SalesSummary {
  period: { from: string; to: string };
  summary: {
    totalSales: number;
    totalTax: number;
    orderCount: number;
    averageOrder: number;
  };
}

interface PopularItem {
  name: string;
  quantity: number;
  revenue: number;
}

interface InventoryAlert {
  id: string;
  name: string;
  currentStock: number;
  minStock: number;
}

interface AttendanceRecord {
  id: string;
  name: string;
  role: string;
  clockIn: string;
  clockOut: string | null;
  status: 'on-duty' | 'completed';
  hours: string | number;
}

export const DashboardPage: React.FC = () => {
  const { get } = useApi();

  // ── Date range ──
  const [dateRange, setDateRange] = useState<'7' | '14' | '30' | 'custom'>('30');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showDateDropdown, setShowDateDropdown] = useState(false);

  // ── Data states ──
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [prevSalesSummary, setPrevSalesSummary] = useState<SalesSummary | null>(null);
  const [popularItems, setPopularItems] = useState<PopularItem[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryAlert[]>([]);
  const [staffAttendance, setStaffAttendance] = useState<AttendanceRecord[]>([]);

  const [loading, setLoading] = useState({
    sales: false,
    popular: false,
    inventory: false,
    attendance: false,
  });

  // ── Resolve date range ──
  const resolveDates = useCallback(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    let start = new Date();

    if (dateRange === 'custom' && customStart && customEnd) {
      start = new Date(customStart);
      start.setHours(0, 0, 0, 0);
      const customEndDate = new Date(customEnd);
      customEndDate.setHours(23, 59, 59, 999);
      return { start, end: customEndDate };
    }

    const days = parseInt(dateRange);
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }, [dateRange, customStart, customEnd]);

  const getPrevPeriodDates = useCallback(() => {
    const { start, end } = resolveDates();
    const duration = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - duration);
    return { start: prevStart, end: prevEnd };
  }, [resolveDates]);

  // ── Fetch sales summary ──
  const fetchSalesSummary = useCallback(async () => {
    setLoading(prev => ({ ...prev, sales: true }));
    const { start, end } = resolveDates();

    try {
      const res = await get(`/reports/sales?from=${start.toISOString()}&to=${end.toISOString()}`);
      if (res.ok) setSalesSummary(res.data as SalesSummary);

      // Fetch previous period for comparison
      const prev = getPrevPeriodDates();
      const prevRes = await get(`/reports/sales?from=${prev.start.toISOString()}&to=${prev.end.toISOString()}`);
      if (prevRes.ok) setPrevSalesSummary(prevRes.data as SalesSummary);
    } catch (err) {
      console.error('Sales fetch error:', err);
    } finally {
      setLoading(prev => ({ ...prev, sales: false }));
    }
  }, [get, resolveDates, getPrevPeriodDates]);

  // ── Fetch popular items ──
  const fetchPopularItems = useCallback(async () => {
    setLoading(prev => ({ ...prev, popular: true }));
    const { start, end } = resolveDates();

    try {
      const res = await get(`/reports/popular-items?from=${start.toISOString()}&to=${end.toISOString()}&limit=5`);
      if (res.ok) setPopularItems((res.data as PopularItem[]) || []);
    } catch (err) {
      console.error('Popular items fetch error:', err);
    } finally {
      setLoading(prev => ({ ...prev, popular: false }));
    }
  }, [get, resolveDates]);

  // ── Fetch low stock ──
  const fetchLowStock = useCallback(async () => {
    setLoading(prev => ({ ...prev, inventory: true }));
    try {
      const res = await get('/inventory');
      if (res.ok) {
        const items = (res.data as any[]) || [];
        const low = items
          .filter((item: any) => item.currentStock <= item.minStock)
          .slice(0, 5)
          .map((item: any) => ({
            id: item.id,
            name: item.name,
            currentStock: item.currentStock,
            minStock: item.minStock,
          }));
        setLowStockItems(low);
      }
    } catch (err) {
      console.error('Inventory fetch error:', err);
    } finally {
      setLoading(prev => ({ ...prev, inventory: false }));
    }
  }, [get]);

  // ── Fetch staff attendance ──
  const fetchAttendance = useCallback(async () => {
    setLoading(prev => ({ ...prev, attendance: true }));

    try {
      const res = await get('/timecard');
      if (res.ok) {
        const timecards = (res.data as any[]) || [];
        const latest = timecards
          .sort((a: any, b: any) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime())
          .slice(0, 5)
          .map((tc: any) => ({
            id: tc.id,
            name: tc.staff?.name || 'Unknown',
            role: tc.staff?.role?.name || 'STAFF',
            clockIn: tc.clockIn,
            clockOut: tc.clockOut,
            status: tc.clockOut ? 'completed' : 'on-duty',
            hours: tc.totalHours ?? '-',
          }));
        setStaffAttendance(latest as AttendanceRecord[]);
      }
    } catch (err) {
      console.error('Attendance fetch error:', err);
    } finally {
      setLoading(prev => ({ ...prev, attendance: false }));
    }
  }, [get]);

  // ── Load all data ──
  useEffect(() => {
    fetchSalesSummary();
    fetchPopularItems();
    fetchLowStock();
    fetchAttendance();
  }, [dateRange, customStart, customEnd]);

  // ── Chart data dari hourly breakdown ──
  const [hourlyData, setHourlyData] = useState<any[]>([]);

  const fetchHourlyData = useCallback(async () => {
    const { start, end } = resolveDates();
    try {
      const res = await get(`/reports/sales/by-hour?from=${start.toISOString()}&to=${end.toISOString()}`);
      if (res.ok) {
        const data = (res.data as any[]) || [];
        setHourlyData(data.map((h: any) => ({
          hour: `${h.hour}:00`,
          revenue: h.total,
          orders: h.count,
        })));
      }
    } catch (err) {
      console.error('Hourly fetch error:', err);
    }
  }, [get, resolveDates]);

  useEffect(() => {
    fetchHourlyData();
  }, [dateRange, customStart, customEnd]);

  // ── Computed stats ──
  const stats = useMemo(() => {
    if (!salesSummary) return null;
    const total = salesSummary.summary.totalSales;
    const count = salesSummary.summary.orderCount;
    const avg = salesSummary.summary.averageOrder;

    // Calculate change vs previous period
    const prevTotal = prevSalesSummary?.summary.totalSales ?? 0;
    const prevCount = prevSalesSummary?.summary.orderCount ?? 0;
    const prevAvg = prevSalesSummary?.summary.averageOrder ?? 0;

    const totalChange = prevTotal > 0 ? ((total - prevTotal) / prevTotal * 100).toFixed(1) : '0';
    const countChange = prevCount > 0 ? ((count - prevCount) / prevCount * 100).toFixed(1) : '0';
    const avgChange = prevAvg > 0 ? ((avg - prevAvg) / prevAvg * 100).toFixed(1) : '0';

    return {
      revenue: `RM ${total.toFixed(2)}`,
      orders: count.toString(),
      avgOrder: `RM ${avg.toFixed(2)}`,
      totalChange: `${Number(totalChange) >= 0 ? '+' : ''}${totalChange}%`,
      countChange: `${Number(countChange) >= 0 ? '+' : ''}${countChange}%`,
      avgChange: `${Number(avgChange) >= 0 ? '+' : ''}${avgChange}%`,
      totalTrend: Number(totalChange) >= 0 ? 'up' : 'down' as 'up' | 'down',
      countTrend: Number(countChange) >= 0 ? 'up' : 'down' as 'up' | 'down',
      avgTrend: Number(avgChange) >= 0 ? 'up' : 'down' as 'up' | 'down',
    };
  }, [salesSummary, prevSalesSummary]);

  // ── Helpers ──
  const formatTimeAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff} min ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)} hours ago`;
    return `${Math.floor(diff / 1440)} days ago`;
  };

  const dateRangeLabel = {
    '7': 'Last 7 days',
    '14': 'Last 14 days',
    '30': 'Last 30 days',
    'custom': 'Custom Range',
  }[dateRange];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of your restaurant performance</p>
        </div>

        {/* Date Range Picker */}
        <div className="relative">
          <button
            onClick={() => setShowDateDropdown(!showDateDropdown)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Calendar className="w-4 h-4 text-gray-500" />
            <span>{dateRangeLabel}</span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showDateDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showDateDropdown && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-3">
              <div className="space-y-1">
                {(['7', '14', '30'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => { setDateRange(d); setShowDateDropdown(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      dateRange === d ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Last {d} days
                  </button>
                ))}
                <div className="border-t border-gray-100 my-2 pt-2">
                  <p className="text-xs text-gray-500 px-3 mb-2">Custom Range</p>
                  <div className="flex gap-2 px-3">
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="flex-1 px-2 py-1.5 border rounded-lg text-xs"
                    />
                    <span className="text-gray-400 self-center">-</span>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="flex-1 px-2 py-1.5 border rounded-lg text-xs"
                    />
                  </div>
                  <button
                    onClick={() => { setDateRange('custom'); setShowDateDropdown(false); }}
                    disabled={!customStart || !customEnd}
                    className="w-full mt-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    Apply Custom Range
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats ? (
          <>
            <StatCard title="Total Revenue" value={stats.revenue} change={stats.totalChange} trend={stats.totalTrend} icon={DollarSign} color="bg-blue-100 text-blue-600" />
            <StatCard title="Total Orders" value={stats.orders} change={stats.countChange} trend={stats.countTrend} icon={Receipt} color="bg-green-100 text-green-600" />
            <StatCard title="Avg Order Value" value={stats.avgOrder} change={stats.avgChange} trend={stats.avgTrend} icon={TrendingUp} color="bg-orange-100 text-orange-600" />
            <StatCard title="Active Staff" value={`${staffAttendance.filter(s => s.status === 'on-duty').length}`} change="Live" trend="up" icon={Users} color="bg-purple-100 text-purple-600" />
          </>
        ) : (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Revenue Overview</h3>
            <span className="text-xs text-gray-400">{dateRangeLabel}</span>
          </div>
          {hourlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v: number) => `RM${v}`} />
                <Tooltip 
                  formatter={(value: number) => [`RM${value.toFixed(2)}`, 'Revenue']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
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
          {loading.popular ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded-lg"></div>
              ))}
            </div>
          ) : popularItems.length > 0 ? (
            <div className="space-y-3">
              {popularItems.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-700">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{item.quantity} sold</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No sales data</p>
          )}
        </div>
      </div>

      {/* Alerts & Staff Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-gray-900">Low Stock Alerts</h3>
          </div>
          {loading.inventory ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg"></div>
              ))}
            </div>
          ) : lowStockItems.length > 0 ? (
            <div className="space-y-3">
              {lowStockItems.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Package className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium text-gray-900">{alert.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-orange-600 font-medium">{alert.currentStock} left</span>
                    <span className="text-xs text-gray-400">(min {alert.minStock})</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">All stock levels healthy</p>
          )}
        </div>

        {/* Staff Attendance */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-gray-900">Staff Attendance</h3>
            </div>
            <span className="text-xs text-gray-400">
              {staffAttendance.filter(s => s.status === 'on-duty').length} on duty
            </span>
          </div>
          {loading.attendance && staffAttendance.length === 0 ? (
            <div className="text-center py-4 text-gray-400">
              <Clock className="w-6 h-6 mx-auto mb-2 animate-spin" />
              <p className="text-sm">Loading attendance...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {staffAttendance.map((staff) => (
                <div key={staff.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      staff.status === 'on-duty' ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {staff.status === 'on-duty' ? (
                        <UserCheck className="w-4 h-4 text-green-600" />
                      ) : (
                        <UserX className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{staff.name}</p>
                      <p className="text-xs text-gray-500">{staff.role} • {formatTimeAgo(staff.clockIn)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${
                      staff.status === 'on-duty' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {staff.status === 'on-duty' ? 'On Duty' : `Done ${staff.hours}h`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};