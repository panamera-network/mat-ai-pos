// Re-export global types for convenience
export type { Staff, Role } from '@mat-ai/types';

// Stores
export { useAuthStore } from './stores/authStore';
export { useDashboardCache } from './stores/dashboardCache';
export { useSalesCache } from './stores/salesCache';
export { useStaffCache } from './stores/staffCache';

// Hooks
export { useApi } from './hooks/useApi';

// Components
export { RoleGuard } from './components/RoleGuard';
export { PinPrompt } from './components/PinPrompt';

// Config
export { NAV_ITEMS, getNavItemsForRole, canAccessRoute, requiresPin } from './config/navigation';

// Constants
export { API_BASE_URL, ROLE_HIERARCHY, DEFAULT_CACHE_TTL } from './constants';

// Backoffice-specific types
export type { AuthState, AuthActions, AuthStore, ApiConfig, NavItem, PinPromptCallback } from './types';