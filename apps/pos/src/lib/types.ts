// apps/pos/src/lib/types.ts
import type {
  Order as OrderBase,
  OrderItem as OrderItemBase,
  OrderType,
  OrderStatus,
  MenuItem as MenuItemBase,
  Table as TableBase,
  Staff as StaffBase,
  TableStatus,
  PaymentMethod,
  StaffRole,
} from '@mat-ai/types';

// ============ POS-SPECIFIC TYPES ============

export interface POSOrderItem {
  id: string;
  menuId: string;
  name: string;
  price: number;
  qty: number;
  modifiers?: string[];
}

export interface CustomerInfo {
  name: string;
  phone: string;
  address?: string;
  note?: string;
}

export interface POSOrder {
  id: string;
  orderNumber?: string;
  items: POSOrderItem[];
  type: OrderType;
  status: 'active' | 'completed' | 'cancelled';
  tableNumber?: string;
  customerInfo?: CustomerInfo;
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
  updatedAt: string;

  // QR Menu fields (optional)
  isQrOrder?: boolean;
  qrOrderId?: string;
  customerName?: string;
  customerPhone?: string;
  address?: string;
  reservationTime?: string;
  pax?: number;
  orderTiming?: 'now' | 'later';
  notes?: string;
}

// ============ BACKWARD COMPATIBILITY ============

export interface OrderItem extends Omit<OrderItemBase, 'modifiers'> {
  id: string;
  menuId: string;
  modifiers?: string[];
}

export interface Order extends Omit<OrderBase, 'orderType' | 'status' | 'items'> {
  type: OrderType;
  status: 'active' | 'completed' | 'cancelled';
  items: OrderItem[];
  customerInfo?: CustomerInfo;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem extends MenuItemBase {
  image?: string;
  categoryId: string;
}

export interface Table extends TableBase {
  number: string;
}

export interface Staff extends StaffBase {}

// ============ INVENTORY ============

export interface InventoryItem {
  id: number;
  name: string;
  category: string;
  weight: number;
  open: number;
  in: number;
  out: number;
  close: number;
}

export interface StockLog {
  id: string;
  itemName: string;
  qty: number;
  previousClose: number;
  newClose: number;
  timestamp: string;
}

// ============ RE-EXPORTS ============

export type { OrderType, OrderStatus, PaymentMethod, StaffRole, TableStatus };
