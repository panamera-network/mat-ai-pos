// apps/backoffice/src/components/Layout.tsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@mat-ai/backoffice';
import { usePermission } from '../hooks/usePermission';
import {
  LayoutDashboard, Receipt, Users, DollarSign, UtensilsCrossed,
  Package, Settings, Store, LogOut, ChevronLeft, ChevronRight,
  Bell, Building2, UserCircle, HelpCircle,
  Calculator, ChefHat, Tag, BookOpen, FileText, Book, Scale, BarChart3,
  ChevronDown,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

// Flat nav items with permission keys
const flatNavItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard' },
  { path: '/sales', label: 'Sales Report', icon: Receipt, permission: 'sales' },
  { path: '/staff', label: 'Staff', icon: Users, permission: 'staff' },
  { path: '/payroll', label: 'Payroll', icon: DollarSign, permission: 'payroll' },
  { path: '/menu', label: 'Item', icon: UtensilsCrossed, permission: 'menu' },
  { path: '/inventory', label: 'Inventory', icon: Package, permission: 'inventory' },
  { path: '/costing', label: 'Costing', icon: Calculator, permission: 'costing' },
  { path: '/costing/recipes', label: 'Recipes', icon: ChefHat, permission: 'recipes' },
  { path: '/outlets', label: 'Outlets', icon: Building2, permission: 'outlets' },
  { path: '/customers', label: 'Customer', icon: UserCircle, permission: 'customers' },
  { path: '/promotions', label: 'Promotions', icon: Tag, permission: 'promotions' },
  { path: '/landing-page', label: 'Landing Page', icon: Tag, permission: 'landing_page' },
  { path: '/settings', label: 'Settings', icon: Settings, permission: 'settings' },
];

// Accounting submenu
const accountingNav = {
  label: 'Perakaunan',
  icon: Calculator,
  permission: 'accounting',
  children: [
    { path: '/accounting/chart-of-accounts', label: 'Carta Akaun', icon: BookOpen, permission: 'chart_of_accounts' },
    { path: '/accounting/journal-entries', label: 'Jurnal Entries', icon: FileText, permission: 'journal_entries' },
    { path: '/accounting/general-ledger', label: 'General Ledger', icon: Book, permission: 'general_ledger' },
    { path: '/accounting/trial-balance', label: 'Trial Balance', icon: Scale, permission: 'trial_balance' },
    { path: '/accounting/financial-reports', label: 'Laporan Kewangan', icon: BarChart3, permission: 'financial_reports' },
  ],
};

const bottomNavItems = [
  { path: '/help', label: 'Help', icon: HelpCircle, permission: 'dashboard' },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { staff, logout } = useAuthStore();
  const { can, isSuperAdmin } = usePermission();
  const [collapsed, setCollapsed] = useState(false);
  const [accountingOpen, setAccountingOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Filter flat items by permission
  const visibleNav = flatNavItems.filter(item => can(item.permission));
  const visibleBottomNav = bottomNavItems.filter(item => can(item.permission));
  
  // Filter accounting children by permission
  const visibleAccountingChildren = accountingNav.children.filter(item => can(item.permission));
  const showAccounting = can(accountingNav.permission) && visibleAccountingChildren.length > 0;

  const isActivePath = (path: string) => {
    if (path === '/costing') {
      return location.pathname === '/costing' || location.pathname === '/costing/calculator';
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const isAccountingActive = location.pathname.startsWith('/accounting');

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
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
          <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 hover:bg-gray-100 rounded-lg">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {/* Flat items */}
          {visibleNav.map((item) => {
            const isActive = isActivePath(item.path);
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}

          {/* Accounting submenu */}
          {showAccounting && (
            <div>
              <button
                onClick={() => !collapsed && setAccountingOpen(!accountingOpen)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isAccountingActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                title={collapsed ? accountingNav.label : undefined}
              >
                <div className="flex items-center gap-3">
                  <Calculator className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span>{accountingNav.label}</span>}
                </div>
                {!collapsed && <ChevronDown className={`w-4 h-4 transition-transform ${accountingOpen ? 'rotate-180' : ''}`} />}
              </button>
              
              {/* Submenu items */}
              {!collapsed && accountingOpen && (
                <div className="ml-4 mt-1 space-y-1">
                  {visibleAccountingChildren.map((child) => {
                    const isActive = location.pathname === child.path;
                    const ChildIcon = child.icon;
                    return (
                      <button
                        key={child.path}
                        onClick={() => navigate(child.path)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                        }`}
                      >
                        <ChildIcon className="w-4 h-4 flex-shrink-0" />
                        <span>{child.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Bottom Nav */}
        <div className="px-2 pb-2 space-y-1">
          {visibleBottomNav.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>

        {/* User */}
        <div className="p-3 border-t border-gray-200">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isSuperAdmin ? 'bg-purple-100' : 'bg-blue-100'}`}>
              <span className={`text-sm font-bold ${isSuperAdmin ? 'text-purple-700' : 'text-blue-700'}`}>
                {staff?.name?.charAt(0) || 'U'}
              </span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{staff?.name || 'User'}</p>
                <p className={`text-xs ${isSuperAdmin ? 'text-purple-600 font-medium' : 'text-gray-500'}`}>
                  {isSuperAdmin ? '👑 SUPER ADMIN' : staff?.role?.name || 'Staff'}
                </p>
              </div>
            )}
            <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-600" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
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
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
};