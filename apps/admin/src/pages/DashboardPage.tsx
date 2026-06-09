// app/admin/src/pages/DashboardPage.tsx
import { useEffect, useState, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { useSocket } from '../hooks/useSocket';
import { useDashboardCache } from '../stores/dashboardCache';
import { SummaryCard } from '../components/SummaryCard';
import { DollarSign, Users, Package, AlertCircle, TrendingUp, Receipt, RefreshCw } from 'lucide-react';

export function DashboardPage() {
  const { get } = useApi();
  const { connected } = useSocket('admin');
  const cache = useDashboardCache();

  const [stats, setStats] = useState(cache.getStats() || {
    todaySales: 0,
    activeStaff: 0,
    lowStock: 0,
    pendingLeave: 0,
    todayOrders: 0,
  });
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(
    cache.timestamp > 0 ? new Date(cache.timestamp) : null
  );

  const fetchStats = useCallback(async (isManual = false) => {
    if (!isManual) setLoading(true);
    try {
      const [ordersRes, staffRes, invRes, leaveRes] = await Promise.all([
        get('/orders'),
        get('/staff'),
        get('/inventory/items'),
        get('/leave/pending'),
      ]);

      const orders = ordersRes.ok ? await ordersRes.json() : [];
      const today = new Date().toISOString().split('T')[0];
      const todayOrders = orders.filter((o: any) => o.createdAt?.startsWith(today) && o.status === 'PAID');
      const todaySales = todayOrders.reduce((sum: number, o: any) => sum + Number(o.totalAmount), 0);

      const staffList = staffRes.ok ? await staffRes.json() : [];
      const activeStaff = staffList.filter((s: any) => s.isActive).length;

      const inventory = invRes.ok ? await invRes.json() : [];
      const lowStock = inventory.filter((i: any) => i.currentStock <= i.minStock).length;

      const leaveList = leaveRes.ok ? await leaveRes.json() : [];

      const newStats = {
        todaySales,
        activeStaff,
        lowStock,
        pendingLeave: leaveList.length,
        todayOrders: todayOrders.length,
      };

      // Only update if changed
      if (JSON.stringify(newStats) !== JSON.stringify(stats)) {
        setStats(newStats);
      }

      cache.setStats(newStats);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [get, stats, cache]);

  useEffect(() => {
    // Auto-fetch if cache expired
    if (cache.isExpired()) {
      fetchStats();
    }

    const interval = setInterval(() => {
      if (cache.isExpired()) {
        fetchStats();
      }
    }, 300000); // Check every 5 min

    return () => clearInterval(interval);
  }, [fetchStats, cache]);

  const timeAgo = () => {
    if (!lastRefresh) return 'Never';
    const diff = Math.floor((Date.now() - lastRefresh.getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff} min ago`;
    return lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchStats(true)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading...' : timeAgo()}
          </button>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-500 hidden sm:inline">{connected ? 'Live' : 'Offline'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
        <SummaryCard title="Today's Sales" value={`RM${stats.todaySales.toFixed(2)}`} icon={DollarSign} color="blue" />
        <SummaryCard title="Orders" value={stats.todayOrders} icon={Receipt} color="blue" />
        <SummaryCard title="Active Staff" value={stats.activeStaff} icon={Users} color="green" />
        <SummaryCard title="Low Stock" value={stats.lowStock} icon={Package} color="orange" />
        <SummaryCard title="Pending Leave" value={stats.pendingLeave} icon={AlertCircle} color="red" />
      </div>

      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Sales Overview
          </h2>
          <div className="h-48 md:h-64 flex items-center justify-center text-gray-400 text-sm">
            Chart placeholder — integrate Recharts here
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            Alerts
          </h2>
          <div className="space-y-3">
            {stats.lowStock > 0 && (
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl">
                <Package className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-orange-900">{stats.lowStock} items low stock</p>
                  <p className="text-xs text-orange-700">Check inventory</p>
                </div>
              </div>
            )}
            {stats.pendingLeave > 0 && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">{stats.pendingLeave} leave requests</p>
                  <p className="text-xs text-blue-700">Awaiting approval</p>
                </div>
              </div>
            )}
            {stats.lowStock === 0 && stats.pendingLeave === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">No alerts — all good!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}