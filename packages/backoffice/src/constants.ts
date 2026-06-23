// packages/backoffice/src/constants.ts

export const API_BASE_URL = 'http://localhost:4000';

// Role hierarchy using string keys (role names)
export const ROLE_HIERARCHY: Record<string, number> = {
  CASHIER: 1,
  KITCHEN: 1,
  MANAGER: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

// Helper to get role level from role name string
export function getRoleLevel(roleName: string | undefined): number {
  if (!roleName) return 0;
  return ROLE_HIERARCHY[roleName] || 0;
}

export const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const PIN_PROMPT_DURATION = 30 * 60 * 1000; // 30 minutes
