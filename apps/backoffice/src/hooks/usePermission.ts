import { useAuthStore } from '@mat-ai/backoffice';

export function usePermission() {
  const { staff } = useAuthStore();

  const can = (permission: string): boolean => {
    if (staff?.isSuperAdmin) return true;
    return staff?.permissions?.[permission] === true;
  };

  const isSuperAdmin = staff?.isSuperAdmin || false;
  const roleName = staff?.roleName || 'Staff';
  const roleId = staff?.roleId;

  return { can, isSuperAdmin, roleName, roleId };
}