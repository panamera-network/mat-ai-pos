import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { ROLE_HIERARCHY, getRoleLevel } from '../constants';

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children, fallback }: RoleGuardProps) {
  const staff = useAuthStore((s) => s.staff);

  if (!staff) {
    return <Navigate to="/" replace />;
  }

  // SUPER ADMIN bypass all role checks
  if (staff.isSuperAdmin) {
    return <>{children}</>;
  }

  // Check role hierarchy for non-super-admin
  const roleName = staff.role?.name || '';
  const userLevel = getRoleLevel(roleName);
  const requiredLevel = Math.min(...allowedRoles.map((r) => ROLE_HIERARCHY[r] || 999));

  if (userLevel < requiredLevel) {
    return fallback ? <>{fallback}</> : <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}