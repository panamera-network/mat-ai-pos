import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import type { Role } from '@mat-ai/types';
import { ROLE_HIERARCHY } from '../constants';

interface RoleGuardProps {
  allowedRoles: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children, fallback }: RoleGuardProps) {
  const staff = useAuthStore((s) => s.staff);

  if (!staff) {
    return <Navigate to="/" replace />;
  }

  const userLevel = ROLE_HIERARCHY[staff.role] || 0;
  const requiredLevel = Math.min(...allowedRoles.map((r) => ROLE_HIERARCHY[r] || 999));

  if (userLevel < requiredLevel) {
    return fallback ? <>{fallback}</> : <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}