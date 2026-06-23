// packages/backoffice/src/hooks/usePermission.ts
import { useAuthStore } from '../stores/authStore';
import { ROLE_HIERARCHY, getRoleLevel } from '../constants';

export function usePermission() {
  const staff = useAuthStore((s) => s.staff);

  // staff.role is Role object, use .name for string comparison
  const roleName = staff?.role?.name || '';
  const isSuperAdmin = staff?.isSuperAdmin || false;

  const can = (permission: string | undefined): boolean => {
    if (isSuperAdmin) return true;
    if (!permission) return true;
    if (!staff?.role?.permissions) return false;
    return staff.role.permissions[permission] === true;
  };

  const hasRole = (requiredRole: string): boolean => {
    if (isSuperAdmin) return true;
    return roleName === requiredRole;
  };

  const hasRoleLevel = (minLevel: number): boolean => {
    if (isSuperAdmin) return true;
    return getRoleLevel(roleName) >= minLevel;
  };

  return { can, hasRole, hasRoleLevel, isSuperAdmin, roleName };
}
