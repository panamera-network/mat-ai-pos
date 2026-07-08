// apps/backoffice/src/pages/CustomerPage.tsx
import React, { useState, useEffect } from 'react';
import { Search, Phone, Star, ShoppingBag, Crown, Calendar } from 'lucide-react';
import { Customer } from '@mat-ai/types';
import { useApi } from '../hooks/useApi';

const OUTLET_ID = import.meta.env.VITE_OUTLET_ID || 'default-outlet';

export const CustomersPage: React.FC = () => {
  const { get } = useApi();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void fetchCustomers();
  }, [get]);

  const fetchCustomers = async () => {
    setLoading(true);
    setError('');
    const res = await get<Customer[]>(`/customers?outletId=${OUTLET_ID}`);
    if (res.ok && res.data) {
      setCustomers(res.data);
    } else {
      setError(res.status === 401 ? 'Session expired. Please sign in again.' : 'Failed to load customers.');
    }
    setLoading(false);
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  const stats = {
    total: customers.length,
    vip: customers.filter((c) => c.isVip).length,
    totalPoints: customers.reduce((sum, c) => sum + c.points, 0),
    totalRevenue: customers.reduce((sum, c) => sum + c.totalSpent, 0),
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Customer CRM</h1>
          <p className="text-gray-500 text-sm mt-1">Manage customers & loyalty</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-100">
          <p className="text-gray-500 text-sm">Total Customers</p>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100">
          <p className="text-gray-500 text-sm">VIP Members</p>
          <p className="text-2xl font-bold text-purple-600">{stats.vip}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100">
          <p className="text-gray-500 text-sm">Total Points Issued</p>
          <p className="text-2xl font-bold text-orange-500">{stats.totalPoints.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100">
          <p className="text-gray-500 text-sm">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600">RM {stats.totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
        />
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {error && (
          <div className="px-4 py-3 bg-red-50 text-red-700 text-sm border-b border-red-100">
            {error}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Visits</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Points</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Spent</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Last Visit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">Loading customers...</td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">No customers found</td>
                </tr>
              )}
              {filtered.map((customer) => (
                <tr
                  key={customer.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedCustomer(customer)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{customer.name}</p>
                        {customer.isVip && (
                          <span className="inline-flex items-center gap-1 text-xs text-purple-600">
                            <Crown className="w-3 h-3" /> VIP
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Phone className="w-3 h-3" />
                      {customer.phone}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{customer.visits}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
                      <span className="font-semibold text-gray-800">{customer.points}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    RM {customer.totalSpent.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    {customer.lastVisit && new Date(customer.lastVisit) > new Date(Date.now() - 7 * 86400000) ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        <ShoppingBag className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                        <Calendar className="w-3 h-3" /> Dormant
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {customer.lastVisit
                      ? new Date(customer.lastVisit).toLocaleDateString()
                      : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{selectedCustomer.name}</h2>
                    <p className="text-sm text-white/80">{selectedCustomer.phone}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-orange-50 rounded-xl">
                  <p className="text-2xl font-bold text-orange-600">{selectedCustomer.visits}</p>
                  <p className="text-xs text-gray-500">Visits</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-xl">
                  <p className="text-2xl font-bold text-yellow-600">{selectedCustomer.points}</p>
                  <p className="text-xs text-gray-500">Points</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-xl">
                  <p className="text-2xl font-bold text-green-600">RM {selectedCustomer.totalSpent.toFixed(0)}</p>
                  <p className="text-xs text-gray-500">Spent</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-sm text-gray-600">Member Since</span>
                <span className="font-medium">{new Date(selectedCustomer.createdAt).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-sm text-gray-600">Last Visit</span>
                <span className="font-medium">
                  {selectedCustomer.lastVisit
                    ? new Date(selectedCustomer.lastVisit).toLocaleDateString()
                    : 'Never'}
                </span>
              </div>

              {selectedCustomer.isVip && (
                <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-xl text-purple-700">
                  <Crown className="w-5 h-5" />
                  <span className="font-semibold">VIP Member</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
