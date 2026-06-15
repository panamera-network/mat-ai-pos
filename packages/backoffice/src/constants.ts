import type { Role } from '@mat-ai/types';

export const API_BASE_URL = 'http://localhost:4000';

export const ROLE_HIERARCHY: Record<Role, number> = {
  CASHIER: 1,
  KITCHEN: 1,
  MANAGER: 2,
  ADMIN: 3,
};

export const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const PIN_PROMPT_DURATION = 30 * 60 * 1000; // 30 minutes