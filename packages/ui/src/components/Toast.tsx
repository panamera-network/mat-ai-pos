import React, { useEffect } from 'react';
import { cn } from '../lib/utils';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps { id: string; type: ToastType; title?: string; message: string; onClose: (id: string) => void; duration?: number; action?: { label: string; onClick: () => void; }; }

export const Toast: React.FC<ToastProps> = ({ id, type, title, message, onClose, duration = 4000, action }) => {
  useEffect(() => { const timer = setTimeout(() => onClose(id), duration); return () => clearTimeout(timer); }, [id, duration, onClose]);
  const styles = {
    success: { bg: 'bg-success-50 dark:bg-success-900/20', border: 'border-success-200 dark:border-success-800', icon: <CheckCircle className="w-5 h-5 text-success-600 dark:text-success-400" />, title: 'text-success-900 dark:text-success-300' },
    error: { bg: 'bg-danger-50 dark:bg-danger-900/20', border: 'border-danger-200 dark:border-danger-800', icon: <AlertCircle className="w-5 h-5 text-danger-600 dark:text-danger-400" />, title: 'text-danger-900 dark:text-danger-300' },
    warning: { bg: 'bg-warning-50 dark:bg-warning-900/20', border: 'border-warning-200 dark:border-warning-800', icon: <AlertTriangle className="w-5 h-5 text-warning-600 dark:text-warning-400" />, title: 'text-warning-900 dark:text-warning-300' },
    info: { bg: 'bg-info-50 dark:bg-info-900/20', border: 'border-info-200 dark:border-info-800', icon: <Info className="w-5 h-5 text-info-600 dark:text-info-400" />, title: 'text-info-900 dark:text-info-300' },
  };
  const style = styles[type];
  return (
    <div className={cn('flex items-start gap-3 p-4 rounded-2xl border shadow-lg min-w-[320px] max-w-md animate-slide-up', style.bg, style.border)}>
      <div className="shrink-0 mt-0.5">{style.icon}</div>
      <div className="flex-1 min-w-0">
        {title && <p className={cn('text-sm font-semibold', style.title)}>{title}</p>}
        <p className="text-sm text-gray-700 dark:text-gray-300">{message}</p>
        {action && <button onClick={action.onClick} className="mt-2 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">{action.label}</button>}
      </div>
      <button onClick={() => onClose(id)} className="shrink-0 p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"><X className="w-4 h-4 text-gray-500" /></button>
    </div>
  );
};

export interface ToastContainerProps { toasts: Array<Omit<ToastProps, 'onClose'>>; onRemove: (id: string) => void; position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'; }

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove, position = 'top-right' }) => {
  const positions = { 'top-right': 'top-4 right-4', 'top-left': 'top-4 left-4', 'bottom-right': 'bottom-4 right-4', 'bottom-left': 'bottom-4 left-4', 'top-center': 'top-4 left-1/2 -translate-x-1/2', 'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2' };
  return (
    <div className={cn('fixed z-[100] flex flex-col gap-2', positions[position])}>
      {toasts.map((toast) => <Toast key={toast.id} {...toast} onClose={onRemove} />)}
    </div>
  );
};