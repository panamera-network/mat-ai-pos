//packages/types/src/index.ts
// ============ ENUMS ============
export type OrderType = 'dine-in' | 'takeaway' | 'delivery';
export type OrderStatus = 'pending' | 'preparing' | 'done' | 'cancelled' | 'refunded' | 'void';
export type PaymentMethod = 'cash' | 'qr' | 'card' | 'delivery';
export type StaffRole = 'cashier' | 'kitchen' | 'admin' | 'owner';
export type DiscountType = 'percentage' | 'fixed';
export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning';
export type ReservationStatus = 'confirmed' | 'arrived' | 'cancelled' | 'no-show';
export type KitchenStatus = 'pending' | 'sent' | 'preparing' | 'done';

// ============ BASE ============
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// ============ STAFF ============
export interface Staff extends BaseEntity {
  name: string;
  pin: string;
  role: StaffRole;
  isActive: boolean;
  phone?: string;
  email?: string;
}

export interface Timecard extends BaseEntity {
  staffId: string;
  staffName: string;
  clockIn: string;
  clockOut?: string;
  totalHours?: number;
  date: string;
}

// ============ MENU ============
export interface Category extends BaseEntity {
  name: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Modifier extends BaseEntity {
  name: string;
  price: number;
  isActive: boolean;
}

export interface MenuItem extends BaseEntity {
  name: string;
  categoryId: string;
  price: number;
  cost?: number;
  stock: number;
  minStock: number;
  isAvailable: boolean;
  image?: string;
  modifiers: string[];
  description?: string;
  barcode?: string;
}

export interface SelectedModifier {
  modifierId: string;
  name: string;
  price: number;
}

// ============ TABLE & RESERVATION ============
export interface Table extends BaseEntity {
  number: string;
  name?: string;
  capacity: number;
  status: TableStatus;
  currentOrderId?: string;
  isActive: boolean;
}

export interface Reservation extends BaseEntity {
  name: string;
  phone: string;
  tableId?: string;
  pax: number;
  date: string;
  time: string;
  status: ReservationStatus;
  notes?: string;
  reminderSent: boolean;
}

// ============ STATION ============
export interface Station extends BaseEntity {
  name: string;
  ipAddress: string;
  categoryIds: string[];
  isActive: boolean;
  deviceType: 'tablet' | 'ipad' | 'android';
  soundEnabled: boolean;
}

// ============ ORDER ============
export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  categoryId: string;
  qty: number;
  price: number;
  modifiers: SelectedModifier[];
  subtotal: number;
  notes?: string;
}

export interface AppliedDiscount {
  type: DiscountType;
  value: number;
  reason?: string;
  amount: number;
}

export interface Payment {
  method: PaymentMethod;
  amount: number;
  change?: number;
  qrProvider?: string;
  cardLast4?: string;
  receiptPrinted: boolean;
  timestamp: string;
}

export interface SplitPayment {
  paymentId: string;
  method: PaymentMethod;
  amount: number;
  timestamp: string;
}

export interface Order extends BaseEntity {
  id: string;
  items: OrderItem[];
  orderType: OrderType;
  tableId?: string;
  tableNumber?: string;
  customerName?: string;
  customerPhone?: string;
  subtotal: number;
  discount?: AppliedDiscount;
  tax?: number;
  serviceCharge?: number;
  total: number;
  finalTotal: number;
  payment?: Payment;
  payments?: SplitPayment[];
  status: OrderStatus;
  kitchenStatus: KitchenStatus;
  cashierId: string;
  cashierName: string;
  orderedAt: string;
  sentToKitchenAt?: string;
  completedAt?: string;
  isQrOrder: boolean;
  qrOrderId?: string;
  originalOrderId?: string;
  movedFromTableId?: string;
}

// ============ REFUND & VOID ============
export interface RefundRequest extends BaseEntity {
  orderId: string;
  receiptNo: string;
  amount: number;
  reason: string;
  requestedBy: string;
  requestedByName: string;
  approvedBy?: string;
  approvedByName?: string;
  status: 'pending' | 'approved' | 'rejected';
  processedAt?: string;
}

export interface VoidRecord extends BaseEntity {
  orderId: string;
  receiptNo: string;
  amount: number;
  reason: string;
  voidedBy: string;
  voidedByName: string;
  timestamp: string;
}

// ============ RECEIPT ============
export interface Receipt extends BaseEntity {
  receiptNo: string;
  orderId: string;
  items: OrderItem[];
  subtotal: number;
  discount?: AppliedDiscount;
  tax: number;
  total: number;
  finalTotal: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  change?: number;
  cashierId: string;
  cashierName: string;
  tableNumber?: string;
  orderType: OrderType;
  printedAt?: string;
  emailedTo?: string;
  savedAsPdf: boolean;
  reprintCount: number;
  lastReprintedAt?: string;
}

// ============ INVENTORY ============
export interface InventoryLog extends BaseEntity {
  menuItemId: string;
  menuItemName: string;
  action: 'deduct' | 'add' | 'adjust' | 'initial';
  qty: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  staffId: string;
  staffName: string;
  timestamp: string;
}

export interface LowStockAlert {
  id: string;
  menuItemId: string;
  menuItemName: string;
  currentStock: number;
  minStock: number;
  alertTime: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
}

// ============ SYNC ============
export interface SyncLog extends BaseEntity {
  type: 'sales' | 'inventory' | 'menu' | 'staff' | 'all';
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  recordsCount: number;
  errorMessage?: string;
  startedAt: string;
  completedAt?: string;
  deviceId: string;
}

// ============ QR ORDER ============
export interface QrOrder extends BaseEntity {
  tableId?: string;
  tableNumber?: string;
  customerName?: string;
  customerPhone?: string;
  orderType: 'dine-in' | 'takeaway';
  items: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  posOrderId?: string;
  sessionId: string;
}

// ============ SETTINGS ============
export interface AppSettings {
  posName: string;
  receiptHeader: string;
  receiptFooter: string;
  taxEnabled: boolean;
  taxRate: number;
  serviceChargeEnabled: boolean;
  serviceChargeRate: number;
  printerIp: string;
  printerPort: number;
  printerEnabled: boolean;
  orderSlipEnabled: boolean;
  kitchenDisplayIp: string;
  kitchenDisplayPort: number;
  supabaseUrl?: string;
  supabaseKey?: string;
  autoSync: boolean;
  syncInterval: number;
  qrBaseUrl: string;
  currency: string;
  language: string;
  dateFormat: string;
  timeFormat: string;
}
