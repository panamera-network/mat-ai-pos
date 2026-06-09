// packages/types/src/index.ts
// ============================================================
// FIXED — Fully synced with prisma/schema.prisma
// Rule: Base interfaces = Database shape (Prisma source of truth)
//       Frontend computed fields = Extended *View interfaces
// ============================================================

// ============ PRISMA-ALIGNED ENUMS (Database Source of Truth) ============
export type Role = 'ADMIN' | 'MANAGER' | 'CASHIER' | 'KITCHEN';
export type EmploymentType = 'HOURLY_PART_TIME' | 'MONTHLY_SALARIED';
export type OrderStatus = 'PENDING' | 'PAID' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';
export type ItemStatus = 'PENDING' | 'PREPARING' | 'READY' | 'SERVED';
export type OrderSource = 'QR_MENU' | 'POS' | 'ONLINE' | 'PHONE';
export type OrderType = 'DINE_IN' | 'PICKUP' | 'DELIVERY' | 'RESERVATION';
export type PaymentMethod = 'CASH' | 'CARD' | 'EWALLET' | 'QR_PAY';
export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING';
export type StockType = 'AUTO_DEDUCT' | 'MANUAL_IN' | 'ADJUSTMENT';
export type LeaveType = 'ANNUAL' | 'SICK' | 'UNPAID' | 'EMERGENCY';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type PayrollPeriod = 'WEEKLY' | 'MONTHLY';
export type PayrollStatus = 'DRAFT' | 'APPROVED' | 'PAID';

// ============ FRONTEND-ONLY / LEGACY ENUMS (NOT in Prisma Schema) ============
export type DiscountType = 'percentage' | 'fixed';
export type ReservationStatus = 'confirmed' | 'arrived' | 'cancelled' | 'no-show';
export type KitchenStatus = 'pending' | 'sent' | 'preparing' | 'done';

// ============ BASE ============
export interface BaseEntity {
  id: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface BaseEntityNoUpdatedAt {
  id: string;
  createdAt: string;
}

// ============ MENU ITEM OPTIONS (Replaces `any` in MenuItem.options / OrderItem.options) ============

export interface OptionChoice {
  id: string;           // e.g., "large", "extra-spicy", "cheese"
  name: string;         // Display: "Large", "Extra Spicy", "Extra Cheese"
  priceModifier: number; // 0 = no extra cost
  isDefault?: boolean;  // Pre-selected?
  sortOrder?: number;
}

export interface MenuItemOption {
  id: string;           // e.g., "size", "spiciness", "toppings"
  name: string;         // Display label: "Size", "Spiciness Level"
  required: boolean;    // Must select at least one?
  multiSelect: boolean; // Single choice vs multiple
  choices: OptionChoice[];
}

/** Strict type for Prisma Json fields — menu item modifier configuration */
export type MenuItemOptions = MenuItemOption[];

/** Snapshot of order items stored in Receipt.itemsSnapshot (Prisma Json) */
export type ReceiptItemsSnapshot = OrderItem[];

/** Customer info stored in Receipt.customerInfo (Prisma Json) */
export interface ReceiptCustomerInfo {
  name?: string;
  phone?: string;
  address?: string;
  note?: string;
}

// ============ STAFF ============
export interface Staff extends BaseEntity {
  name: string;
  pin: string;
  role: Role;
  isActive: boolean;
  employmentType: EmploymentType;
  hourlyRate?: number;        // Prisma Decimal → serialized as number/string
  monthlySalary?: number;
  joinDate: string;
  customEpfRate?: number;
  customSocsoRate?: number;
}

export interface StaffView extends Staff {
  // Frontend computed / legacy fields (NOT in Prisma Staff table)
  phone?: string;
  email?: string;
}

export interface Timecard extends BaseEntityNoUpdatedAt {
  staffId: string;
  staff?: Staff;
  clockIn: string;
  clockOut?: string;
  breakMinutes: number;
  totalMinutes?: number;
  totalHours?: number;
  verifiedBy?: string;
  verifiedAt?: string;
}

// ============ LEAVE ============
export interface LeaveRequest extends BaseEntityNoUpdatedAt {
  staffId: string;
  staff?: Staff;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
  status: LeaveStatus;
  approvedBy?: string;
  approvedAt?: string;
  payrollDeduction?: number;
}

// ============ ADVANCE ============
export interface StaffAdvance extends BaseEntityNoUpdatedAt {
  staffId: string;
  staff?: Staff;
  amount: number;
  reason?: string;
  takenAt: string;
  totalInstallments: number;
  paidInstallments: number;
  installmentAmount: number;
  isFullyPaid: boolean;
  paidOffAt?: string;
  deductions?: AdvanceDeduction[];
}

export interface AdvanceDeduction extends BaseEntityNoUpdatedAt {
  advanceId: string;
  advance?: StaffAdvance;
  payrollId: string;
  payroll?: Payroll;
  amount: number;
}

// ============ PAYROLL ============
export interface Payroll extends BaseEntity {
  staffId: string;
  staff?: Staff;
  periodStart: string;
  periodEnd: string;
  periodType: PayrollPeriod;
  basicPay: number;
  overtimeHours: number;
  overtimePay: number;
  totalEarnings: number;
  leaveDeduction: number;
  epfEmployee: number;
  epfEmployer: number;
  socsoEmployee: number;
  socsoEmployer: number;
  advanceDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  nettPay: number;
  status: PayrollStatus;
  paidAt?: string;
  paidBy?: string;
  pdfUrl?: string;
  advanceDeductions?: AdvanceDeduction[];
}

// ============ MENU ============
export interface Category extends BaseEntity {
  name: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface MenuItem extends BaseEntity {
  name: string;
  price: number;        // Prisma Decimal
  categoryId: string;
  category?: Category;  // <-- FIXED: Prisma now returns nested category object
  imageUrl?: string;    // <-- FIXED: was `image` in old types
  isAvailable: boolean;
  stock: number;
  minStock: number;
  options?: MenuItemOptions;  // <-- FIXED: was `any`, now strict type
  ingredients?: MenuItemIngredient[];
}

export interface MenuItemView extends MenuItem {
  // Frontend-only extensions (not persisted in Prisma MenuItem)
  cost?: number;
  description?: string;
  barcode?: string;
  modifiers?: string[]; // legacy — consider migrating to `options`
}

export interface SelectedModifier {
  modifierId: string;
  name: string;
  price: number;
}

// ============ TABLE ============
export interface Table extends BaseEntity {
  number: string;
  capacity: number;
  status: TableStatus;
}

export interface TableView extends Table {
  // Frontend computed (NOT in Prisma Table table)
  name?: string;
  currentOrderId?: string;
  isActive?: boolean;
}

// ============ CUSTOMER (Cross-app reusable) ============
export interface CustomerInfo {
  name: string;
  phone: string;
  address?: string;
  note?: string;
}

// ============ RESERVATION (Frontend-only — no Prisma model yet) ============
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

// ============ STATION (Frontend-only — no Prisma model yet) ============
export interface Station extends BaseEntity {
  name: string;
  ipAddress: string;
  categoryIds: string[];
  isActive: boolean;
  deviceType: 'tablet' | 'ipad' | 'android';
  soundEnabled: boolean;
}

// ============ ORDER (Database Shape — matches Prisma Order exactly) ============
export interface OrderItem extends BaseEntity {
  orderId: string;
  menuItemId: string;
  menuItem?: MenuItem;   // <-- FIXED: Prisma relation
  name: string;
  quantity: number;      // <-- FIXED: was `qty`
  unitPrice: number;     // <-- FIXED: was `price`
  totalPrice: number;    // <-- FIXED: was `subtotal`
  options?: MenuItemOptions;  // <-- FIXED: was `any`, now strict type
  notes?: string;
  status: ItemStatus;    // <-- FIXED: was missing / using KitchenStatus
}

export interface OrderItemInput {
  // Use this for creating orders from frontend cart
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  options?: MenuItemOptions;  // <-- FIXED: was `any`, now strict type
  notes?: string;
}

export interface Order extends BaseEntity {
  orderNumber: string;           // <-- FIXED: was missing! Required by Prisma
  status: OrderStatus;
  source: OrderSource;           // <-- FIXED: was missing
  type: OrderType;               // <-- FIXED: was `orderType`
  totalAmount: number;           // <-- FIXED: was `total` / `finalTotal`
  paidAmount?: number;
  taxAmount?: number;
  paymentMethod?: PaymentMethod;
  customerInfo?: CustomerInfo;
  tableId?: string;
  table?: Table;
  pax?: number;
  reservationTime?: string;
  notes?: string;
  completedAt?: string;
  items: OrderItem[];
  receipt?: Receipt;
}

export interface OrderView extends Order {
  // Frontend computed / legacy fields (NOT in Prisma Order table)
  tableNumber?: string;
  cashierId?: string;      // <-- NOTE: lives in Receipt table, not Order
  cashierName?: string;    // <-- NOTE: lives in Receipt table, not Order
  kitchenStatus?: KitchenStatus; // <-- NOTE: NOT in Prisma Order. Derive from items[]
  subtotal?: number;       // Frontend calc: totalAmount - taxAmount
  discount?: AppliedDiscount;
  tax?: number;
  serviceCharge?: number;
  finalTotal?: number;     // Alias for totalAmount + tax + serviceCharge - discount
  payment?: Payment;
  payments?: SplitPayment[];
  orderedAt?: string;      // Alias for createdAt
  sentToKitchenAt?: string;
  isQrOrder?: boolean;
  qrOrderId?: string;
  originalOrderId?: string;
  movedFromTableId?: string;
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

// ============ DRAFT ORDER (Frontend state before submit) ============
export interface DraftOrder {
  id?: string;
  orderNumber?: string;
  items: CartItem[];
  type: OrderType;
  status: OrderStatus;
  tableId?: string;
  customerInfo?: CustomerInfo;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  pax?: number;
  reservationTime?: string;
  notes?: string;
  subtotal: number;
  tax: number;
  total: number;
}

// ============ CART ITEM (Frontend state) ============
export interface CartItem {
  id: string;              // frontend-generated
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;      // computed
  modifiers?: string[];    // legacy frontend format
  options?: MenuItemOptions;  // <-- FIXED: was `any`, now strict type
  notes?: string;
}

// ============ RECEIPT (Database Shape — matches Prisma Receipt exactly) ============
// NOTE: Receipt has NO updatedAt in Prisma schema — uses BaseEntityNoUpdatedAt
export interface Receipt extends BaseEntityNoUpdatedAt {
  receiptNo: string;
  orderId: string;
  order?: Order;
  totalAmount: number;      // <-- FIXED: was `total`
  paidAmount: number;       // <-- FIXED: was `amountPaid`
  change?: number;
  paymentMethod: PaymentMethod; // <-- FIXED: was `string`
  taxAmount?: number;
  cashierId: string;
  cashier?: Staff;
  posId: string;            // <-- FIXED: was missing
  itemsSnapshot: ReceiptItemsSnapshot;  // <-- FIXED: was `any`, now strict type
  customerInfo?: ReceiptCustomerInfo;   // <-- FIXED: was `any`, now strict type
  printCount: number;
  lastPrintedAt?: string;
  pdfGeneratedAt?: string;
  pdfUrl?: string;
  emailedTo?: string;
  emailSentAt?: string;
}

export interface ReceiptView extends Receipt {
  // Frontend unpacked view
  items?: OrderItem[];      // <-- Parsed from itemsSnapshot JSON
  cashierName?: string;
  tableNumber?: string;
  orderType?: OrderType;
  printedAt?: string;       // Alias for lastPrintedAt
  reprintCount?: number;    // Alias for printCount
  lastReprintedAt?: string;  // Alias for lastPrintedAt
  savedAsPdf?: boolean;
}

// ============ RECEIPT SUMMARY (POS display) ============
export interface ReceiptSummary {
  id: string;
  receiptNo: string;
  tableNumber: string;
  orderType: string;
  time: string;
  cashier: string;
  posId: string;
  items: { name: string; quantity: number; unitPrice: number }[];
  total: number;
  paymentMethod: string;
}

// ============ REFUND & VOID (No Prisma models — keep as-is) ============
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

export interface VoidRecord {
  orderId: string;
  receiptNo: string;
  amount: number;
  reason: string;
  voidedBy: string;
  voidedByName: string;
  timestamp: string;
}

// ============ INVENTORY ============

export interface StockLog extends BaseEntity {
  type: StockType;
  menuItemId?: string;
  menuItem?: MenuItem;
  inventoryItemId?: string;
  inventoryItem?: InventoryItem;
  quantity: number;
  orderId?: string;
  reason?: string;
  staffId?: string;         // <-- FIXED: was non-nullable, now optional (match Prisma)
  staff?: Staff;
}

export interface InventoryLog extends BaseEntity {
  menuItemId: string;
  menuItemName: string;
  action: StockType;         // <-- FIXED: was custom string union, now uses StockType
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

// ============ INVENTORY (Raw Material) ============
export interface InventoryItem extends BaseEntity {
  name: string;
  category: string;
  unit: string;
  weight?: number;        // ← ADDED: grams per pack/unit
  currentStock: number;
  minStock: number;
  costPerUnit?: number;   // ← ADDED: for COGS tracking
  supplier?: string;
  isActive: boolean;
}

export interface MenuItemIngredient {
  id: string;
  inventoryItemId: string;
  inventoryItem?: InventoryItem;
  menuItemId: string;
  menuItem?: MenuItem;
  quantityUsed: number;
}

// ============ INVENTORY API RESPONSES ============
export interface StockInResponse {
  item: InventoryItem;
  log: StockLog;
  previousStock: number;
  newStock: number;
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

// ============ QR ORDER (No Prisma model — keep as-is) ============
export interface QrOrder extends BaseEntity {
  tableId?: string;
  tableNumber?: string;
  customerName?: string;
  customerPhone?: string;
  orderType: 'DINE_IN' | 'PICKUP'; // <-- aligned with Prisma OrderType subset
  items: OrderItemInput[]; // <-- Use input shape, not DB shape
  total: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  posOrderId?: string;
  sessionId: string;
}

// ============ SETTINGS ============
export interface Setting extends BaseEntity {
  key: string;
  value: string;
  description?: string;
  updatedBy?: string;
}

// AppSettings = hydrated from multiple Setting rows (frontend config object)
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

// ============ API DTOs / Helpers ============
export interface CreateOrderPayload {
  // Strict payload for POST /orders — only fields Prisma accepts
  type: OrderType;
  source?: OrderSource;
  totalAmount: number;
  paidAmount?: number;
  taxAmount?: number;
  paymentMethod?: PaymentMethod;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  tableId?: string;
  pax?: number;
  reservationTime?: string;
  notes?: string;
  items: OrderItemInput[];
}