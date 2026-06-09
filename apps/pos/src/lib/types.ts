// apps/pos/src/lib/types.ts
import type {
  OrderType,
  OrderStatus,
  TableStatus,
  PaymentMethod,
  Staff,
  CustomerInfo,
} from '@mat-ai/types';

export type { OrderType, OrderStatus, PaymentMethod, Staff, TableStatus, CustomerInfo };

// ============ POS-SPECIFIC TYPES ============

export interface POSOrderItem {
  id: string;
  menuId: string;        // maps to backend menuItemId
  name: string;
  price: number;         // maps to backend unitPrice
  qty: number;           // maps to backend quantity
  modifiers?: string[];  // legacy frontend format → maps to backend options
}

export interface POSOrder {
  id: string;
  orderNumber?: string;
  items: POSOrderItem[];
  type: 'dine-in' | 'takeaway' | 'delivery' | 'reservation';
  status: 'active' | 'completed' | 'cancelled';
  tableNumber?: string;
  customerInfo?: CustomerInfo;
  customerName?: string;
  customerPhone?: string;
  address?: string;
  reservationTime?: string;
  pax?: number;
  orderTiming?: 'now' | 'later';
  notes?: string;
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  isQrOrder?: boolean;
  qrOrderId?: string;
}

// ============ POS INVENTORY (Local-only, different from global InventoryItem) ============

export interface POSInventoryItem {
  id: number;           // local sequential ID
  name: string;
  category: string;      // frozen, chiller, cheese, etc.
  weight: number;        // grams per pack/unit
  open: number;         // opening stock
  in: number;           // stock received today
  out: number;          // stock used today
  close: number;        // computed: open + in - out
}

export interface POSInventoryStockLog {
  id: string;
  itemName: string;
  qty: number;
  previousClose: number;
  newClose: number;
  timestamp: string;
}

// ============ CONVERTERS ============

/** POS frontend → Backend CreateOrderPayload */
export function posOrderToPayload(
  order: POSOrder,
  selectedTableId: string,
  orderType: string,
): any {
  const hasTable = orderType === 'dine-in' || orderType === 'reservation';
  
  return {
    orderNumber: order.orderNumber || `ORD-${Date.now()}`,
    type: toBackendOrderType(orderType),
    source: 'POS',
    totalAmount: order.total,
    taxAmount: order.tax,
    customerName: order.customerName || undefined,
    customerPhone: order.customerPhone || undefined,
    customerAddress: order.address || undefined,
    tableId: hasTable ? (selectedTableId || undefined) : undefined,
    pax: order.pax || undefined,
    reservationTime: order.reservationTime || undefined,
    notes: order.notes || undefined,
    items: order.items.map(item => ({
      menuItemId: item.menuId,
      name: item.name,
      quantity: item.qty,
      unitPrice: item.price,
      totalPrice: (Number(item.price) || 0) * item.qty,
      options: item.modifiers && item.modifiers.length > 0 ? item.modifiers : undefined,
      notes: undefined,
    })),
  };
}

/** Backend Order → POS frontend */
export function normalizeBackendOrder(data: any): POSOrder {
  return {
    id: data.id,
    orderNumber: data.orderNumber || data.id?.slice(-4) || '',
    items: (data.items || []).map((i: any) => ({
      id: i.id || i.menuItemId || crypto.randomUUID?.() || Math.random().toString(36).slice(2),
      menuId: i.menuItemId || i.id || '',
      name: i.name || 'Unknown',
      price: Number(i.unitPrice) || Number(i.price) || 0,
      qty: Number(i.quantity) || Number(i.qty) || 0,
      modifiers: i.options || [],
    })),
    type: toFrontendOrderType(data.type),
    status: toFrontendStatus(data.status),
    tableNumber: data.table?.number || data.tableNumber,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    customerInfo: data.customerName ? {
      name: data.customerName,
      phone: data.customerPhone || '',
    } : undefined,
    address: data.customerAddress || data.address,
    reservationTime: data.reservationTime,
    pax: data.pax,
    orderTiming: 'now',
    notes: data.notes,
    subtotal: Number(data.totalAmount) / 1.08 || 0,
    tax: Number(data.taxAmount) || 0,
    total: Number(data.totalAmount) || 0,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
    isQrOrder: data.source === 'QR_MENU' || data.isQrOrder,
    qrOrderId: data.qrOrderId,
  };
}

// ============ HELPERS ============

export function toBackendOrderType(type: string): string {
  const map: Record<string, string> = {
    'dine-in': 'DINE_IN',
    'takeaway': 'PICKUP',
    'delivery': 'DELIVERY',
    'reservation': 'RESERVATION',
  };
  return map[type] || 'DINE_IN';
}

export function toFrontendOrderType(type: string): POSOrder['type'] {
  const map: Record<string, POSOrder['type']> = {
    'DINE_IN': 'dine-in',
    'PICKUP': 'takeaway',
    'DELIVERY': 'delivery',
    'RESERVATION': 'reservation',
  };
  return map[type] || 'dine-in';
}

export function toFrontendStatus(status: string): POSOrder['status'] {
  switch (status) {
    case 'PENDING': return 'active';
    case 'PAID': return 'completed';
    case 'CANCELLED': return 'cancelled';
    default: return 'active';
  }
}