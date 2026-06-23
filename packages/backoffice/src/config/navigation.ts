// packages/backoffice/src/config/navigation.ts
import {
  Receipt, Utensils, TrendingUp, Users, DollarSign, Package, Settings, Edit3,
} from 'lucide-react';
import type { NavItem } from '../types';

export const NAV_ITEMS: NavItem[] = [
  { icon: Receipt, label: 'Receipt', path: '/receipts', roles: ['CASHIER', 'MANAGER', 'ADMIN'], requiresPin: false },
  { icon: Utensils, label: 'POS', path: '/pos', roles: ['CASHIER', 'MANAGER', 'ADMIN'], requiresPin: false },
  { icon: TrendingUp, label: 'Sales Report', path: '/sales', roles: ['MANAGER', 'ADMIN'], requiresPin: true },
  { icon: Users, label: 'Staff', path: '/staff', roles: ['MANAGER', 'ADMIN'], requiresPin: true },
  { icon: DollarSign, label: 'Payroll', path: '/payroll', roles: ['ADMIN'], requiresPin: false },
  { icon: Package, label: 'Inventory', path: '/inventory', roles: ['MANAGER', 'ADMIN'], requiresPin: true },
  { icon: Edit3, label: 'Menu Edit', path: '/menu', roles: ['ADMIN'], requiresPin: false },
  { icon: Settings, label: 'Settings', path: '/settings', roles: ['CASHIER', 'MANAGER', 'ADMIN'], requiresPin: false },
];

// Use string for role name (from role.name)
export function getNavItemsForRole(roleName: string | undefined): NavItem[] {
  if (!roleName) return [];
  return NAV_ITEMS.filter((item) => item.roles.includes(roleName));
}

export function canAccessRoute(roleName: string | undefined, path: string): boolean {
  if (!roleName) return false;
  const item = NAV_ITEMS.find((n) => n.path === path);
  if (!item) return true;
  return item.roles.includes(roleName);
}

export function requiresPin(roleName: string | undefined, path: string): boolean {
  if (!roleName) return false;
  const item = NAV_ITEMS.find((n) => n.path === path);
  if (!item) return false;
  return item.requiresPin && roleName !== 'ADMIN';
}
