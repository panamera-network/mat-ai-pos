// apps/backoffice/src/pages/DashboardPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import type { FC } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
  AreaChart, Area  // ← TAMBAH NI
} from 'recharts';
import { useApi } from '@mat-ai/backoffice';
import {
  TrendingUp, TrendingDown, Users, Receipt, DollarSign,
  Package, AlertTriangle, ArrowUpRight, Calendar,
  Clock, UserCheck, UserX, ChevronDown, Store
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

// Mock chart data generator
const generateChartData = (days: number) => {
  const data = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' }),
      fullDate: date.toISOString().split('T')[0],
      revenue: Math.floor(Math.random() * 3000) + 1000,
      orders: Math.floor(Math.random() * 50) + 10,
    });
  }
  return data;
};

// ✅ Revenue Chart — guna direct import
const RevenueChart: React.FC<{ data: any[]; color: string }> = ({ data, color }) => {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={color} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
        <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v: number) => `RM${v}`} />
        <Tooltip 
          formatter={(value: number) => [`RM${value}`, 'Revenue']}
          contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
        />
        <Area type="monotone" dataKey="revenue" stroke={color} strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export const DashboardPage: React.FC = () => {
  const { get } = useApi();
  const [stats] = useState({
    revenue: 'RM 12,450',
    orders: '1,284',
    customers: '892',
    avgOrder: 'RM 9.70',
  });

  // Settings from localStorage
  const [settings, setSettings] = useState({
    restaurantName: 'MAT.ai Restaurant',
    restaurantLogo: '',
  });

  // Date range
  const [dateRange, setDateRange] = useState<'7' | '14' | '30' | 'custom'>('30');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showDateDropdown, setShowDateDropdown] = useState(false);

  // Staff attendance data
  const [staffAttendance, setStaffAttendance] = useState<any[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // Chart data
  const chartDays = dateRange === 'custom' && customStart && customEnd 
    ? Math.max(1, Math.ceil((new Date(customEnd).getTime() - new Date(customStart).getTime()) / (1000 * 60 * 60 * 24)))
    : parseInt(dateRange);
  const chartData = useMemo(() => generateChartData(chartDays), [chartDays]);

  // Load settings
  useEffect(() => {
    const saved = localStorage.getItem('mat-ai-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings({
          restaurantName: parsed.restaurantName || 'MAT.ai Restaurant',
          restaurantLogo: parsed.restaurantLogo || '',
        });
      } catch {}
    }
  }, []);

  // Fetch staff attendance
  useEffect(() => {
    const fetchAttendance = async () => {
      setLoadingAttendance(true);
      try {
        const res = await get('/timecard');
        if (res.ok) {
          const timecards = (res.data as any[]) || [];
          // Get latest 5 timecards with staff info
          const latest = timecards
            .sort((a: any, b: any) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime())
            .slice(0, 5)
            .map((tc: any) => ({
              id: tc.id,
              name: tc.staff?.name || 'Unknown',
              role: tc.staff?.role || 'STAFF',
              clockIn: tc.clockIn,
              clockOut: tc.clockOut,
              status: tc.clockOut ? 'completed' : 'on-duty',
              hours: tc.totalHours || '-',
            }));
          setStaffAttendance(latest);
        }
      } catch (err) {
        console.error('Attendance fetch error:', err);
        // Fallback mock data
        setStaffAttendance([
          { id: '1', name: 'Ahmad', role: 'MANAGER', clockIn: new Date(Date.now() - 2 * 60000).toISOString(), status: 'on-duty', hours: '-' },
          { id: '2', name: 'Siti', role: 'CASHIER', clockIn: new Date(Date.now() - 15 * 60000).toISOString(), clockOut: new Date(Date.now() - 5 * 60000).toISOString(), status: 'completed', hours: '8.0' },
          { id: '3', name: 'Ali', role: 'KITCHEN', clockIn: new Date(Date.now() - 30 * 60000).toISOString(), status: 'on-duty', hours: '-' },
          { id: '4', name: 'Mira', role: 'CASHIER', clockIn: new Date(Date.now() - 60 * 60000).toISOString(), clockOut: new Date(Date.now() - 10 * 60000).toISOString(), status: 'completed', hours: '7.5' },
          { id: '5', name: 'Raj', role: 'WAITER', clockIn: new Date(Date.now() - 120 * 60000).toISOString(), status: 'on-duty', hours: '-' },
        ]);
      } finally {
        setLoadingAttendance(false);
      }
    };
    fetchAttendance();
  }, [get]);

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
      {/* Header with Logo & Restaurant Name */}
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
                    className="w-full mt-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
        <StatCard title="Total Revenue" value={stats.revenue} change="+12.5%" trend="up" icon={DollarSign} color="bg-blue-100 text-blue-600" />
        <StatCard title="Total Orders" value={stats.orders} change="+8.2%" trend="up" icon={Receipt} color="bg-green-100 text-green-600" />
        <StatCard title="Customers" value={stats.customers} change="+15.3%" trend="up" icon={Users} color="bg-purple-100 text-purple-600" />
        <StatCard title="Avg Order Value" value={stats.avgOrder} change="-2.1%" trend="down" icon={TrendingUp} color="bg-orange-100 text-orange-600" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Revenue Overview</h3>
            <span className="text-xs text-gray-400">{dateRangeLabel}</span>
          </div>
          <RevenueChart data={chartData} color="#2563eb" />
        </div>

        {/* Top Items */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Top Selling Items</h3>
          <div className="space-y-3">
            {['Nasi Lemak Ayam', 'Teh Tarik', 'Roti Canai', 'Mee Goreng', 'Kopi O'].map((item, i) => (
              <div key={item} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                    {i + 1}
                  </span>
                  <span className="text-sm text-gray-700">{item}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{[342, 298, 256, 198, 175][i]} sold</span>
              </div>
            ))}
          </div>
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
          <div className="space-y-3">
            {[
              { item: 'Ayam Goreng', stock: 5, min: 20 },
              { item: 'Teh Tarik Powder', stock: 3, min: 15 },
              { item: 'Roti Canai Dough', stock: 8, min: 25 },
            ].map((alert) => (
              <div key={alert.item} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Package className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium text-gray-900">{alert.item}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-orange-600 font-medium">{alert.stock} left</span>
                  <span className="text-xs text-gray-400">(min {alert.min})</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Staff Attendance Dashboard */}
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
          <div className="space-y-3">
            {loadingAttendance && staffAttendance.length === 0 ? (
              <div className="text-center py-4 text-gray-400">
                <Clock className="w-6 h-6 mx-auto mb-2 animate-spin" />
                <p className="text-sm">Loading attendance...</p>
              </div>
            ) : (
              staffAttendance.map((staff) => (
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
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};