// packages/ui/src/index.ts
// ============================================================
// MAT.ai UI Kit — Beautiful, consistent, dark-mode ready
// ============================================================

// Utilities
export { cn } from './lib/utils';

// Hooks
export { useToast } from './hooks/useToast';
export { useDarkMode } from './hooks/useDarkMode';

// Components
export { Button } from './components/Button';
export type { ButtonProps } from './components/Button';

export { Input } from './components/Input';
export type { InputProps } from './components/Input';

export { Select } from './components/Select';
export type { SelectProps, SelectOption } from './components/Select';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './components/Card';
export type { CardProps } from './components/Card';

export { Badge } from './components/Badge';
export type { BadgeProps, BadgeVariant, BadgeSize } from './components/Badge';

export { Modal, ConfirmDialog } from './components/Modal';
export type { ModalProps, ConfirmDialogProps } from './components/Modal';

export { Toast, ToastContainer } from './components/Toast';
export type { ToastProps, ToastType, ToastContainerProps } from './components/Toast';

export { TableCard } from './components/TableCard';
export type { TableCardProps } from './components/TableCard';

export { OrderCard } from './components/OrderCard';
export type { OrderCardProps } from './components/OrderCard';

export { StatCard } from './components/StatCard';
export type { StatCardProps } from './components/StatCard';

export { MenuItemCard } from './components/MenuItemCard';
export type { MenuItemCardProps } from './components/MenuItemCard';

export { EmptyState } from './components/EmptyState';
export type { EmptyStateProps } from './components/EmptyState';

export { LoadingSpinner } from './components/LoadingSpinner';
export type { LoadingSpinnerProps } from './components/LoadingSpinner';

export { Tabs, TabList, Tab, TabPanel } from './components/Tabs';

export { Switch } from './components/Switch';
export type { SwitchProps } from './components/Switch';

export { Tooltip } from './components/Tooltip';
export type { TooltipProps } from './components/Tooltip';

export { Avatar } from './components/Avatar';
export type { AvatarProps } from './components/Avatar';

export { Skeleton, SkeletonCard, SkeletonTable } from './components/Skeleton';
export type { SkeletonProps } from './components/Skeleton';

export { DataTable } from './components/DataTable';
export type { DataTableProps, Column } from './components/DataTable';

export { StatusBadge } from './components/StatusBadge';
export type { StatusBadgeProps, StatusType } from './components/StatusBadge';

// Styles (import in your app entry)
// import '@mat-ai/ui/styles/globals.css';