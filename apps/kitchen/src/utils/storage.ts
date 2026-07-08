// apps/kitchen/src/utils/storage.ts
// localStorage helpers for KDS — Order History stays local

import type { HistoryOrder, KdsSettings } from '../types/kitchen';

const KEYS = {
  HISTORY: 'mat-kds-history',
  SETTINGS: 'mat-kds-settings',
};

const LEGACY_DEFAULT_IPS = new Set(['192.168.1.100', '192.168.100.122']);

const getDefaultSettings = (): KdsSettings => {
  const hostName = typeof window !== 'undefined' ? window.location.hostname : '';
  const posIp = hostName && hostName !== '127.0.0.1' ? hostName : 'localhost';

  return {
    posIp,
    posPort: 8080,
    stationName: 'Main Kitchen',
    soundEnabled: true,
    soundVolume: 0.7,
  };
};

// ============ HISTORY (localStorage — KDS standalone) ============

export const getHistory = (): HistoryOrder[] => {
  try {
    const raw = localStorage.getItem(KEYS.HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const addToHistory = (order: HistoryOrder): void => {
  const history = getHistory();
  history.unshift(order);
  if (history.length > 500) history.pop();
  localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
};

export const clearHistory = (): void => {
  localStorage.removeItem(KEYS.HISTORY);
};

// ============ SETTINGS ============

export const getSettings = (): KdsSettings => {
  const defaults = getDefaultSettings();
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      const merged = { ...defaults, ...parsed };
      if (LEGACY_DEFAULT_IPS.has(String(parsed.posIp)) && defaults.posIp !== 'localhost') {
        merged.posIp = defaults.posIp;
      }
      return merged;
    }
  } catch {
    // fall through
  }
  return defaults;
};

export const saveSettings = (settings: KdsSettings): void => {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
};

export const resetSettings = (): void => {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(getDefaultSettings()));
};

// ============ RESET ============

export const resetMemory = (): void => {
  clearHistory();
};

export const resetAll = (): void => {
  clearHistory();
  resetSettings();
};
