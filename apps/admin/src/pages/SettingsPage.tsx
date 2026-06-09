// app/admin/src/pages/SettingsPage.tsx
import { useAuth } from '../hooks/useAuth';
import { LogOut, Store, Percent, Printer, User, Shield, Bell, CreditCard } from 'lucide-react';

export function SettingsPage() {
  const { staff, logout } = useAuth();

  const settingsGroups = [
    {
      title: 'Business',
      items: [
        { icon: Store, label: 'Business Info', desc: 'Name, address, contact' },
        { icon: Percent, label: 'Tax & Charges', desc: 'SST, service charge' },
        { icon: CreditCard, label: 'Payment Methods', desc: 'Cash, card, e-wallet' },
      ],
    },
    {
      title: 'Hardware',
      items: [
        { icon: Printer, label: 'Printer Settings', desc: 'Receipt printer config' },
        { icon: Bell, label: 'Notifications', desc: 'Alerts and sounds' },
      ],
    },
    {
      title: 'Security',
      items: [
        { icon: Shield, label: 'Staff PIN', desc: 'Manage access codes' },
        { icon: User, label: 'Roles', desc: 'Admin, manager, cashier' },
      ],
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900">Settings</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 md:p-6 flex items-center gap-4 border-b border-gray-100">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
            <User className="w-7 h-7 md:w-8 md:h-8 text-blue-600" />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">{staff?.name || 'Admin'}</p>
            <p className="text-sm text-gray-500">{staff?.role || 'Manager'} • {staff?.employmentType?.replace('_', ' ') || ''}</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {settingsGroups.map((group) => (
          <div key={group.title} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 md:px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">{group.title}</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {group.items.map((item) => (
                <button key={item.label} className="w-full flex items-center gap-3 md:gap-4 p-4 md:px-6 hover:bg-gray-50 transition-colors text-left">
                  <item.icon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-500 hidden sm:block">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={logout}
        className="w-full md:w-auto md:px-8 flex items-center justify-center gap-2 py-4 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors"
      >
        <LogOut className="w-5 h-5" />
        Logout
      </button>
    </div>
  );
}