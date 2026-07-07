// apps/pos/src/lib/types.ts
import type {
  Order,
  OrderItem,
  OrderType,
  OrderStatus,
  DiningTableStatus,
  PaymentMethod,
  Staff,
  CustomerInfo,
  Receipt,
  ReceiptItemsSnapshot,
  OrderView,
} from '@mat-ai/types';

export type { Order, OrderItem, OrderType, OrderStatus, DiningTableStatus, PaymentMethod, Staff, CustomerInfo, Receipt, OrderView };

// ============ FRONTEND DISPLAY HELPERS ============

/** Backend OrderType → Display string */
export function getOrderTypeLabel(type: OrderType): string {
  const labels: Record<OrderType, string> = {
    DINE_IN: 'Dine In',
    PICKUP: 'Takeaway',
    DELIVERY: 'Delivery',
    RESERVATION: 'Reservation',
  };
  return labels[type] || type;
}

/** Backend OrderStatus → Frontend display status */
export function toFrontendStatus(status: OrderStatus): string {
  switch (status) {
    case 'PENDING':     return 'active';
    case 'PREPARING':   return 'preparing';
    case 'READY':       return 'ready';
    case 'SERVED':      return 'completed';
    case 'PAID':        return 'completed';
    case 'CANCELLED':   return 'cancelled';
    default:            return 'active';
  }
}

/** Frontend kebab-case type → Backend OrderType */
export function toBackendOrderType(type: string): OrderType {
  const map: Record<string, OrderType> = {
    'dine-in': 'DINE_IN',
    'takeaway': 'PICKUP',
    'delivery': 'DELIVERY',
    'reservation': 'RESERVATION',
  };
  return map[type] || 'DINE_IN';
}

/** Backend OrderType → Frontend kebab-case */
export function toFrontendOrderType(type: OrderType): string {
  const map: Record<OrderType, string> = {
    'DINE_IN': 'dine-in',
    'PICKUP': 'takeaway',
    'DELIVERY': 'delivery',
    'RESERVATION': 'reservation',
  };
  return map[type] || 'dine-in';
}

/** Backend DiningTableStatus → Frontend display */
export function toFrontendTableStatus(status: DiningTableStatus): string {
  return status.toLowerCase();
}

// ============ ORDER CONVERTERS ============

/** Backend Order → Frontend Order (normalize) */
export function normalizeBackendOrder(data: any): Order {
  const items: OrderItem[] = (data.items || []).map((i: any) => ({
    id: i.id || i.menuItemId || crypto.randomUUID?.() || Math.random().toString(36).slice(2),
    orderId: data.id,
    menuItemId: i.menuItemId || i.id || '',
    menuItem: i.menuItem,
    name: i.name || 'Unknown',
    quantity: Number(i.quantity) || Number(i.qty) || 0,
    unitPrice: Number(i.unitPrice) || Number(i.price) || 0,
    totalPrice: (Number(i.unitPrice) || Number(i.price) || 0) * (Number(i.quantity) || Number(i.qty) || 0),
    options: i.options || [],
    notes: i.notes,
    status: i.status || 'PENDING',
    createdAt: i.createdAt || new Date().toISOString(),
    updatedAt: i.updatedAt || new Date().toISOString(),
  }));

  return {
    id: data.id,
    orderNumber: data.orderNumber || data.id?.slice(-4) || '',
    status: data.status || 'PENDING',
    source: data.source || 'POS',
    type: data.type || 'DINE_IN',
    totalAmount: Number(data.totalAmount) || Number(data.total) || 0,
    paidAmount: Number(data.paidAmount) || 0,
    taxAmount: Number(data.taxAmount) || 0,
    paymentMethod: data.paymentMethod,
    customerInfo: data.customerInfo || (data.customerName ? {
      name: data.customerName,
      phone: data.customerPhone || '',
      address: data.customerAddress,
      note: data.notes,
    } : undefined),
    tableId: data.tableId || data.table?.id,
    table: data.table,
    pax: data.pax,
    reservationTime: data.reservationTime,
    notes: data.notes,
    completedAt: data.completedAt,
    items,
    receipt: data.receipt,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
}

/** Frontend Order → Backend CreateOrderPayload */
export function buildOrderPayload(
  order: Order,
  selectedTableId: string,
  orderType: string,
): any {
  const hasTable = orderType === 'dine-in';

  return {
    orderNumber: order.orderNumber || `ORD-${Date.now()}`,
    type: toBackendOrderType(orderType),
    source: order.source || 'POS',
    totalAmount: order.totalAmount,
    taxAmount: order.taxAmount,
    customerName: order.customerInfo?.name,
    customerPhone: order.customerInfo?.phone,
    customerAddress: order.customerInfo?.address,
    tableId: hasTable ? (selectedTableId || undefined) : undefined,
    pax: order.pax,
    reservationTime: order.reservationTime,
    notes: order.notes,
    items: order.items.map(item => ({
      menuItemId: item.menuItemId,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      options: item.options && item.options.length > 0 ? item.options : undefined,
      notes: item.notes,
    })),
  };
}

// ============ RECEIPT HELPERS ============

/** Generate receipt from order + payment */
export function generateReceipt(
  order: Order,
  paymentMethod: PaymentMethod,
  paidAmount: number,
  cashierId: string,
  posId: string,
): Receipt {
  const change = paidAmount - order.totalAmount;

  return {
    id: crypto.randomUUID(),
    receiptNo: `RCP-${Date.now()}`,
    orderId: order.id,
    totalAmount: order.totalAmount,
    paidAmount,
    change: change > 0 ? change : undefined,
    paymentMethod,
    taxAmount: order.taxAmount,
    cashierId,
    posId,
    itemsSnapshot: order.items as ReceiptItemsSnapshot,
    customerInfo: order.customerInfo ? {
      name: order.customerInfo.name,
      phone: order.customerInfo.phone,
      address: order.customerInfo.address,
      note: order.customerInfo.note,
    } : undefined,
    printCount: 1,
    lastPrintedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
}

// ============ ORDER VIEW HELPERS ============

/** Check if order is from QR Menu */
export function isQrOrder(order: Order): boolean {
  return order.source === 'QR_MENU';
}

/** Build OrderView from Order (add computed frontend fields) */
export function toOrderView(order: Order): OrderView {
  return {
    ...order,
    tableNumber: order.table?.number,
    isQrOrder: order.source === 'QR_MENU',
    subtotal: Number(order.totalAmount) / 1.08,
    tax: order.taxAmount,
    finalTotal: order.totalAmount,
    orderedAt: order.createdAt,
  };
}
