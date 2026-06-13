import React, { useEffect } from 'react';
import { cn } from '../lib/utils';
import { X } from 'lucide-react';
import { Button } from './Button';

export interface ModalProps {
  isOpen: boolean; onClose: () => void; title?: string; description?: string;
  children: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showClose?: boolean; footer?: React.ReactNode; className?: string; preventBackdropClose?: boolean;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, description, children, size = 'md', showClose = true, footer, className, preventBackdropClose = false }) => {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'; else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape' && !preventBackdropClose) onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose, preventBackdropClose]);
  if (!isOpen) return null;

  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl', full: 'max-w-[95vw]' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => !preventBackdropClose && onClose()} />
      <div className={cn('relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full animate-scale-in', sizes[size], className)}>
        {(title || showClose) && (
          <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex-1 min-w-0">
              {title && <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h3>}
              {description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
            </div>
            {showClose && <Button variant="ghost" size="sm" onClick={onClose} className="ml-2 shrink-0"><X className="w-5 h-5" /></Button>}
          </div>
        )}
        <div className="px-6 py-4">{children}</div>
        {footer && <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">{footer}</div>}
      </div>
    </div>
  );
};

export interface ConfirmDialogProps extends Omit<ModalProps, 'children' | 'footer'> {
  confirmText?: string; cancelText?: string; onConfirm: () => void; confirmVariant?: 'primary' | 'danger' | 'success'; icon?: React.ReactNode;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, confirmVariant = 'danger', icon, ...modalProps }) => (
  <Modal {...modalProps} size="sm" footer={<><Button variant="ghost" onClick={modalProps.onClose}>{cancelText}</Button><Button variant={confirmVariant} onClick={onConfirm}>{confirmText}</Button></>}>
    <div className="flex items-start gap-4">
      {icon && <div className="shrink-0 w-12 h-12 rounded-2xl bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center">{icon}</div>}
      <div>
        {modalProps.title && <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{modalProps.title}</h3>}
        {modalProps.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{modalProps.description}</p>}
      </div>
    </div>
  </Modal>
);