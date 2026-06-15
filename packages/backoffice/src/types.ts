// Backoffice-specific types (Role, Staff imported from @mat-ai/types)
import type { ReactNode, ComponentType } from 'react';
import type { Staff, Role } from '@mat-ai/types';

// Re-export for convenience
export type { Staff, Role } from '@mat-ai/types';

export interface AuthState {
  staff: Staff | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthActions {
  login: (pinOrEmail: string, password?: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  checkAuth: () => boolean;
}

export type AuthStore = AuthState & AuthActions;

export interface ApiConfig {
  baseUrl: string;
  token: string | null;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // milliseconds
}

export type NavItem = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  path: string;
  roles: Role[];
  requiresPin: boolean;
};

export type PinPromptCallback = (success: boolean) => void;