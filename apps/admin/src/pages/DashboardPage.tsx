import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Clock, Package, Receipt, RefreshCw, Table2, TrendingUp, Users } from 'lucide-react';
import { StatCard } from '@mat-ai/ui';
import { useApi } from '../hooks/useApi';
import { useSocket } from '../hooks/useSocket';
import {
  InventoryItem,
  Order,
  StaffMember,
  Table,
  compactLabel,
  formatDateTime,
  isOpenOrder,
  isPaidOrder,
  isToday,
  money,
  readJson,
  toNumber,
} from '../lib/adminData';

export function DashboardPage() {
  const { get } = useApi();
  const { connected } = useSocket('admin');
  const [orders, setOrders] = useState<Order[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [ordersRes, staffRes, invRes, tablesRes] = await Promise.all([
        get('/orders'),
        get('/staff'),
        get('/inventory/items'),
        get('/tables'),
      ]);

      setOrders(await readJson<Order[]>(ordersRes, []));
      setStaff(await readJson<StaffMember[]>(staffRes, []));
      setInventory(await readJson<InventoryItem[]>(invRes, []));
      setTables(await readJson<Table[]>(tablesRes, []));
      setLastRefresh(new Date());
    } catch {
      setError('Unable to load admin overview');
    } finally {
      setLoading(false);
    }
  }, [get]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const metrics = useMemo(() => {
    const todayOrders = orders.filter((order) => isToday(order.createdAt));
    const paidToday = todayOrders.filter(isPaidOrder);
    const activeOrders = orders.filter(isOpenOrder);
    const todaySales = paidToday.reduce((sum, order) => sum + toNumber(order.totalAmount), 0);
    const activeStaff = staff.filter((member) => member.isActive).length;
    const lowStock = inventory.filter((item) => toNumber(item.currentStock) <= toNumber(item.minStock));
    const occupiedTables = tables.filter((table) => table.status === 'OCCUPIED').length;

    const byType = todayOrders.reduce<Record<string, { count: number; total: number }>>((acc, order) => {
      const key = String(order.type ?? 'UNKNOWN');
      acc[key] = acc[key] ?? { count: 0, total: 0 };
      acc[key].count += 1;
      acc[key].total += toNumber(order.totalAmount);
      return acc;
    }, {});

    return {
      todaySales,
      paidCount: paidToday.length,
      activeOrders: activeOrders.length,
      activeStaff,
      lowStock,
      occupiedTables,
      tableCount: tables.length,
      byType: Object.entries(byType).sort(([, a], [, b]) => b.total - a.total),
      recentOrders: [...orders]
        .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
        .slice(0, 8),
    };
  }, [inventory, orders, staff, tables]);

  const updatedAt = lastRefresh
    ? lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Never';

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Admin View</p>
          <h1 className="text-2xl font-bold text-gray-950 md:text-3xl">Business Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            {new Date().toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboard}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 shadow-sm hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {updatedAt}
          </button>
          <div className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-medium text-gray-600 shadow-sm ring-1 ring-gray-200">
            <span className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {connected ? 'Live' : 'Polling'}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-6">
        <StatCard title="Today Sales" value={money(metrics.todaySales)} icon={TrendingUp} color="success" />
        <StatCard title="Paid Orders" value={metrics.paidCount} icon={Receipt} color="primary" />
        <StatCard title="Active Orders" value={metrics.activeOrders} icon={Clock} color="warning" />
        <StatCard title="Tables Used" value={`${metrics.occupiedTables}/${metrics.tableCount}`} icon={Table2} color="primary" />
        <StatCard title="Active Staff" value={metrics.activeStaff} icon={Users} color="success" />
        <StatCard title="Low Stock" value={metrics.lowStock.length} icon={Package} color="danger" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-lg border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-4 py-3 md:px-5">
            <h2 className="font-semibold text-gray-950">Recent Orders</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {metrics.recentOrders.length === 0 && (
              <div className="px-4 py-10 text-center text-sm text-gray-400">No orders yet</div>
            )}
            {metrics.recentOrders.map((order) => (
              <div key={order.id} className="grid grid-cols-[1fr_auto] gap-3 px-4 py-3 md:grid-cols-[1fr_120px_120px_auto] md:px-5">
                <div>
                  <p className="text-sm font-semibold text-gray-950">{order.orderNumber ?? order.id.slice(0, 8)}</p>
                  <p className="text-xs text-gray-500">{formatDateTime(order.createdAt)}</p>
                </div>
                <div className="hidden text-sm text-gray-600 md:block">{compactLabel(order.type)}</div>
                <div className="hidden md:block">
                  <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                    {compactLabel(order.status)}
                  </span>
                </div>
                <p className="text-right text-sm font-bold text-gray-950">{money(order.totalAmount)}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="space-y-4">
          <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm md:p-5">
            <div className="mb-4 flex items-center gap-2">
              <Receipt className="h-5 w-5 text-blue-600" />
              <h2 className="font-semibold text-gray-950">Today By Type</h2>
            </div>
            <div className="space-y-3">
              {metrics.byType.length === 0 && <p className="text-sm text-gray-400">No order activity today</p>}
              {metrics.byType.map(([type, value]) => (
                <div key={type}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{compactLabel(type)}</span>
                    <span className="text-gray-500">{value.count} orders</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${Math.min(100, (value.total / Math.max(metrics.todaySales, 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm md:p-5">
            <div className="mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <h2 className="font-semibold text-gray-950">Attention</h2>
            </div>
            <div className="space-y-3">
              {metrics.lowStock.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2">
                  <span className="text-sm font-medium text-amber-950">{item.name ?? 'Item'}</span>
                  <span className="text-xs text-amber-700">
                    {toNumber(item.currentStock)} / {toNumber(item.minStock)} {item.unit ?? ''}
                  </span>
                </div>
              ))}
              {metrics.lowStock.length === 0 && <p className="text-sm text-gray-400">No stock alerts</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
