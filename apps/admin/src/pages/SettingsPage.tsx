import { Bell, Database, LogOut, Shield, Store, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function SettingsPage() {
  const { staff, logout } = useAuth();
  const roleName = typeof staff?.role === 'string' ? staff.role : staff?.role?.name || 'Admin';

  const accessItems = [
    { icon: Shield, label: 'Access Level', value: roleName },
    { icon: Store, label: 'Workspace', value: 'MAT.ai POS' },
    { icon: Database, label: 'Data Mode', value: 'Read-only dashboard' },
    { icon: Bell, label: 'Live Updates', value: 'Orders and staff activity' },
  ];

  return (
    <div className="space-y-5 md:space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Account</p>
        <h1 className="text-2xl font-bold text-gray-950 md:text-3xl">Admin Profile</h1>
      </div>

      <section className="rounded-lg border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center gap-4 border-b border-gray-100 p-4 md:p-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-blue-50">
            <User className="h-7 w-7 text-blue-600" />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-950">{staff?.name || 'Admin'}</p>
            <p className="text-sm text-gray-500">{roleName}</p>
          </div>
        </div>
        <div className="grid gap-0 divide-y divide-gray-100 md:grid-cols-2 md:divide-x md:divide-y-0">
          {accessItems.map((item) => (
            <div key={item.label} className="flex items-center gap-3 p-4 md:p-5">
              <item.icon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className="text-sm font-semibold text-gray-950">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm md:p-5">
        <h2 className="font-semibold text-gray-950">Admin Scope</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <ScopeCard title="Sales" text="Revenue, paid orders, order mix" />
          <ScopeCard title="Staff" text="Roster, attendance, payroll status" />
          <ScopeCard title="Stock" text="Inventory levels and stock movement" />
        </div>
      </section>

      <button
        onClick={logout}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-50 px-5 py-3 font-medium text-red-600 hover:bg-red-100 md:w-auto"
      >
        <LogOut className="h-5 w-5" />
        Logout
      </button>
    </div>
  );
}

function ScopeCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
      <p className="text-sm font-semibold text-gray-950">{title}</p>
      <p className="mt-1 text-sm text-gray-500">{text}</p>
    </div>
  );
}
