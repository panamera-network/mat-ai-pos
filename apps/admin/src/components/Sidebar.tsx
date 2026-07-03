import { NavLink } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, Users, Package, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function Sidebar() {
  const { staff, logout } = useAuth();
  const roleName = staff?.role?.name || 'Manager';

  const links = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/sales', label: 'Sales', icon: TrendingUp },
    { path: '/staff', label: 'Staff', icon: Users },
    { path: '/inventory', label: 'Inventory', icon: Package },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 z-40">
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-xl font-bold text-blue-600">MAT Admin</h1>
        <p className="text-xs text-gray-500 mt-1">Manager Dashboard</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-4 px-4">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{staff?.name || 'Admin'}</p>
            <p className="text-xs text-gray-500">{roleName}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
