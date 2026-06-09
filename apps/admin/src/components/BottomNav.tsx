import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, Users, Package, Settings } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export function BottomNav() {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || location.pathname === '/login') return null;

  const tabs = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/sales', label: 'Sales', icon: TrendingUp },
    { path: '/staff', label: 'Staff', icon: Users },
    { path: '/inventory', label: 'Stock', icon: Package },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-16 pb-safe">
        {tabs.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full text-xs transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-400'
              }`
            }
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}