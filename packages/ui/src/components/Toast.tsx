import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '../utils/cn';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  onClose: (id: string) => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ id, type, message, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-500" />,
  };

  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg min-w-[300px]',
      {
        'bg-green-50 border border-green-200': type === 'success',
        'bg-red-50 border border-red-200': type === 'error',
        'bg-blue-50 border border-blue-200': type === 'info',
        'bg-yellow-50 border border-yellow-200': type === 'warning',
      }
    )}>
      {icons[type]}
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button onClick={() => onClose(id)} className="p-1 hover:bg-black/5 rounded">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
