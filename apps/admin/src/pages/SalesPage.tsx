import { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, CreditCard, Receipt, RefreshCw, TrendingUp } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { Order, compactLabel, formatDateTime, isPaidOrder, money, readJson, toNumber, withinDays } from '../lib/adminData';

type Period = 'today' | 'week' | 'month';

const periodDays: Record<Period, number> = {
  today: 1,
  week: 7,
  month: 30,
};

export function SalesPage() {
  const { get } = useApi();
  const [period, setPeriod] = useState<Period>('today');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await get('/orders');
      setOrders(await readJson<Order[]>(res, []));
      setLastRefresh(new Date());
    } catch {
      setError('Unable to load sales');
    } finally {
      setLoading(false);
    }
  }, [get]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const report = useMemo(() => {
    const filtered = orders
      .filter(isPaidOrder)
      .filter((order) => (period === 'today' ? withinDays(order.createdAt, 1) : withinDays(order.createdAt, periodDays[period])));

    const total = filtered.reduce((sum, order) => sum + toNumber(order.totalAmount), 0);
    const average = filtered.length > 0 ? total / filtered.length : 0;
    const byType = filtered.reduce<Record<string, { count: number; total: number }>>((acc, order) => {
      const key = String(order.type ?? 'UNKNOWN');
      acc[key] = acc[key] ?? { count: 0, total: 0 };
      acc[key].count += 1;
      acc[key].total += toNumber(order.totalAmount);
      return acc;
    }, {});

    return {
      orders: filtered.sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()),
      total,
      average,
      byType: Object.entries(byType).sort(([, a], [, b]) => b.total - a.total),
    };
  }, [orders, period]);

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Sales</p>
          <h1 className="text-2xl font-bold text-gray-950 md:text-3xl">Sales Overview</h1>
        </div>
        <button
          onClick={fetchSales}
          disabled={loading}
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 shadow-sm hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {lastRefresh ? lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Refresh'}
        </button>
      </div>

      <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
        {(['today', 'week', 'month'] as Period[]).map((item) => (
          <button
            key={item}
            onClick={() => setPeriod(item)}
            className={`rounded-md px-4 py-2 text-sm font-medium capitalize ${
              period === item ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard icon={TrendingUp} label="Revenue" value={money(report.total)} tone="text-emerald-600" />
        <SummaryCard icon={Receipt} label="Paid Orders" value={report.orders.length.toString()} tone="text-blue-600" />
        <SummaryCard icon={CreditCard} label="Average Order" value={money(report.average)} tone="text-violet-600" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm md:p-5">
          <div className="mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h2 className="font-semibold text-gray-950">Order Mix</h2>
          </div>
          <div className="space-y-4">
            {report.byType.length === 0 && <p className="text-sm text-gray-400">No paid sales in this period</p>}
            {report.byType.map(([type, value]) => (
              <div key={type}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{compactLabel(type)}</span>
                  <span className="text-gray-500">{money(value.total)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${Math.min(100, (value.total / Math.max(report.total, 1)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-4 py-3 md:px-5">
            <h2 className="font-semibold text-gray-950">Paid Orders</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {report.orders.length === 0 && (
              <div className="px-4 py-10 text-center text-sm text-gray-400">No paid sales in this period</div>
            )}
            {report.orders.slice(0, 30).map((order) => (
              <div key={order.id} className="grid grid-cols-[1fr_auto] gap-3 px-4 py-3 md:grid-cols-[1fr_130px_110px_auto] md:px-5">
                <div>
                  <p className="text-sm font-semibold text-gray-950">{order.orderNumber ?? order.id.slice(0, 8)}</p>
                  <p className="text-xs text-gray-500">{formatDateTime(order.createdAt)}</p>
                </div>
                <p className="hidden text-sm text-gray-600 md:block">{compactLabel(order.type)}</p>
                <p className="hidden text-sm text-gray-500 md:block">{order.items?.length ?? 0} items</p>
                <p className="text-right text-sm font-bold text-gray-950">{money(order.totalAmount)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm md:p-5">
      <div className="mb-3 flex items-center gap-2 text-sm text-gray-500">
        <Icon className={`h-5 w-5 ${tone}`} />
        {label}
      </div>
      <p className="text-2xl font-bold text-gray-950 md:text-3xl">{value}</p>
    </div>
  );
}
