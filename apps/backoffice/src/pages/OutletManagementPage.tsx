import React, { useState } from 'react';
import {
  Plus, Store, MapPin, Phone, Users, TrendingUp,
  Edit3, Trash2, MoreHorizontal
} from 'lucide-react';

interface Outlet {
  id: string;
  name: string;
  address: string;
  phone: string;
  staffCount: number;
  monthlyRevenue: number;
  status: 'active' | 'inactive';
}

export const OutletManagementPage: React.FC = () => {
  const [outlets] = useState<Outlet[]>([
    { id: '1', name: 'MAT.ai HQ', address: 'Kuala Lumpur', phone: '+60 3-1234 5678', staffCount: 12, monthlyRevenue: 45000, status: 'active' },
    { id: '2', name: 'MAT.ai Branch 1', address: 'Petaling Jaya', phone: '+60 3-8765 4321', staffCount: 8, monthlyRevenue: 28000, status: 'active' },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Outlet Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage multiple restaurant locations</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Add Outlet
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {outlets.map((outlet) => (
          <div key={outlet.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Store className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{outlet.name}</h3>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    outlet.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {outlet.status}
                  </span>
                </div>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <MoreHorizontal className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin className="w-4 h-4" />
                {outlet.address}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Phone className="w-4 h-4" />
                {outlet.phone}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Staff</p>
                <p className="text-lg font-bold text-gray-900">{outlet.staffCount}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Monthly Revenue</p>
                <p className="text-lg font-bold text-gray-900">RM{outlet.monthlyRevenue.toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button className="flex-1 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1">
                <Edit3 className="w-3.5 h-3.5" />
                Edit
              </button>
              <button className="flex-1 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                Reports
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
