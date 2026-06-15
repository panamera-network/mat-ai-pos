import React, { useEffect, useState } from 'react';
import { useApi } from '@mat-ai/backoffice';
import {
  TrendingUp, TrendingDown, Users, Receipt, DollarSign,
  Package, AlertTriangle, ArrowUpRight, Calendar
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

export const DashboardPage: React.FC = () => {
  const { get } = useApi();
  const [stats, setStats] = useState({
    revenue: 'RM 12,450',
    orders: '1,284',
    customers: '892',
    avgOrder: 'RM 9.70',
  });

  useEffect(() => {
    // TODO: Fetch real stats from API
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of your restaurant performance</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          Last 30 days
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
        {/* Revenue Chart Placeholder */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Revenue Overview</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center border border-dashed border-gray-300">
            <p className="text-gray-400">Revenue chart will be rendered here</p>
          </div>
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

      {/* Alerts & Quick Actions */}
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

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {[
              { action: 'New order #1024', time: '2 min ago', type: 'order' },
              { action: 'Staff Ali clocked in', time: '15 min ago', type: 'staff' },
              { action: 'Inventory updated', time: '1 hour ago', type: 'inventory' },
              { action: 'Payment received RM45.00', time: '2 hours ago', type: 'payment' },
            ].map((activity, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'order' ? 'bg-blue-500' :
                    activity.type === 'staff' ? 'bg-green-500' :
                    activity.type === 'inventory' ? 'bg-orange-500' : 'bg-purple-500'
                  }`} />
                  <span className="text-sm text-gray-700">{activity.action}</span>
                </div>
                <span className="text-xs text-gray-400">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
