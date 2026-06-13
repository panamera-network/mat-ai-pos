import { useState, useCallback } from 'react';
import type { ToastType } from '../components/Toast';

export interface ToastItem {
  id: string; type: ToastType; title?: string; message: string;
  duration?: number; action?: { label: string; onClick: () => void; };
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const add = useCallback((toast: Omit<ToastItem, 'id'>) => { const id = crypto.randomUUID(); setToasts((prev) => [...prev, { ...toast, id }]); return id; }, []);
  const remove = useCallback((id: string) => { setToasts((prev) => prev.filter((t) => t.id !== id)); }, []);
  const success = useCallback((message: string, title?: string) => add({ type: 'success', message, title, duration: 4000 }), [add]);
  const error = useCallback((message: string, title?: string) => add({ type: 'error', message, title, duration: 6000 }), [add]);
  const warning = useCallback((message: string, title?: string) => add({ type: 'warning', message, title, duration: 5000 }), [add]);
  const info = useCallback((message: string, title?: string) => add({ type: 'info', message, title, duration: 4000 }), [add]);
  const clear = useCallback(() => setToasts([]), []);
  return { toasts, add, remove, success, error, warning, info, clear };
}