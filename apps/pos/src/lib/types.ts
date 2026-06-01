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

// Extend/override untuk backward compatibility POS app
export interface POSOrderItem {
  id: string;           // cart item ID
  menuId: string;       // menuItemId
  name: string;
  price: number;
  qty: number;
  modifiers?: string[]; // string array untuk UI
}

export interface CustomerInfo {
  name: string;
  phone: string;
  address?: string;
  note?: string;
}

export interface POSOrder {
  id: string;
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
}

export interface OrderItem extends Omit<OrderItemBase, 'modifiers'> {
  id: string;           // POS app guna id untuk cart item
  menuId: string;       // POS app guna menuId
  modifiers?: string[]; // POS app guna string[], bukan SelectedModifier[]
}

export interface Order extends Omit<OrderBase, 'orderType' | 'status' | 'items'> {
  type: OrderType;                    // POS app guna 'type', bukan 'orderType'
  status: 'active' | 'completed' | 'cancelled'; // POS app guna simplified status
  items: OrderItem[];
  customerInfo?: {
    name: string;
    phone: string;
    address?: string;
    note?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem extends MenuItemBase {
  image?: string;       // POS app guna 'image', types guna icon?
  categoryId: string;
}

export interface Table extends TableBase {
  number: string;
}

export interface Staff extends StaffBase {}

// Inventory (takde dalam @mat-ai/types, kena define sendiri)
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

// ============ RE-EXPORT UNTIL KONVENIEN ============

export type { OrderType, OrderStatus, PaymentMethod, StaffRole, TableStatus };