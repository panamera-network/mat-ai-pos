import React from 'react';
import { UserCircle, Search } from 'lucide-react';

export const CustomerPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer</h1>
          <p className="text-sm text-gray-500 mt-1">Customer management and loyalty program</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <UserCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Customer Management</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Customer profiles and loyalty tracking coming soon. 
          This will integrate with the loyalty settings once enabled.
        </p>
      </div>
    </div>
  );
};