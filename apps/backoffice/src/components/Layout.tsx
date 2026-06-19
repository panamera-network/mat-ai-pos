// apps/backoffice/src/components/Layout.tsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@mat-ai/backoffice';
import {
  LayoutDashboard, Receipt, Users, DollarSign, UtensilsCrossed,
  Package, Settings, Store, LogOut, ChevronLeft, ChevronRight,
  Bell, Search, Building2, UserCircle, HelpCircle,
  Calculator, ChefHat, TrendingUp, BarChart3, Tag, Star
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

// Main navigation items
const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['CASHIER', 'MANAGER', 'ADMIN'] },
  { path: '/sales', label: 'Sales Report', icon: Receipt, roles: ['MANAGER', 'ADMIN'] },
  { path: '/staff', label: 'Staff', icon: Users, roles: ['MANAGER', 'ADMIN'] },
  { path: '/payroll', label: 'Payroll', icon: DollarSign, roles: ['ADMIN'] },
  { path: '/menu', label: 'Item', icon: UtensilsCrossed, roles: ['MANAGER', 'ADMIN'] },
  { path: '/inventory', label: 'Inventory', icon: Package, roles: ['MANAGER', 'ADMIN'] },

  // Costing section
  { path: '/costing', label: 'Costing', icon: Calculator, roles: ['MANAGER', 'ADMIN'] },
  { path: '/costing/recipes', label: 'Recipes', icon: ChefHat, roles: ['MANAGER', 'ADMIN'] },

  { path: '/outlets', label: 'Outlets', icon: Building2, roles: ['ADMIN', 'SUPER_ADMIN'] },
  { path: '/customers', label: 'Customer', icon: UserCircle, roles: ['MANAGER', 'ADMIN'] },
  { path: '/promotions', label: 'Promotions', icon: Tag, roles: ['MANAGER', 'ADMIN'] },
  { path: '/landing-page', label: 'Landing Page', icon: Tag, roles: ['MANAGER', 'ADMIN'] },
  { path: '/settings', label: 'Settings', icon: Settings, roles: ['ADMIN'] },
];

// Bottom navigation items
const bottomNavItems = [
  { path: '/help', label: 'Help', icon: HelpCircle, roles: ['CASHIER', 'MANAGER', 'ADMIN'] },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { staff, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Filter nav items by role
  const visibleNav = navItems.filter(item =>
    staff?.role && item.roles.includes(staff.role)
  );

  const visibleBottomNav = bottomNavItems.filter(item =>
    staff?.role && item.roles.includes(staff.role)
  );

  // Check if path is active (exact match or starts with for nested routes)
  const isActivePath = (path: string) => {
    if (path === '/costing') {
      return location.pathname === '/costing' || location.pathname === '/costing/calculator';
    }
    // Exact match for /promotion
    if (path === '/promotion') {
      return location.pathname === '/promotion';
    }
    if (path === '/landing-page') {
    return location.pathname === '/landing-page';
  }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-900">MAT.ai</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 hover:bg-gray-100 rounded-lg"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {visibleNav.map((item) => {
            const isActive = isActivePath(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom Nav */}
        <div className="px-2 pb-2 space-y-1">
          {visibleBottomNav.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>

        {/* User */}
        <div className="p-3 border-t border-gray-200">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-blue-700">
                {staff?.name?.charAt(0) || 'U'}
              </span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{staff?.name || 'User'}</p>
                <p className="text-xs text-gray-500">{staff?.role || 'Staff'}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-600"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">MAT.ai Restaurant</span>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 hover:bg-gray-100 rounded-lg">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-xs font-medium text-green-700">Online</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
