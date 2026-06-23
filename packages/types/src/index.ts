// packages/types/src/index.ts
// ============================================================
// FIXED — Dynamic Role System
// ============================================================

// ============ PRISMA-ALIGNED ENUMS ============
export type EmploymentType = 'HOURLY_PART_TIME' | 'MONTHLY_SALARIED';
export type OrderStatus = 'PENDING' | 'PAID' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';
export type ItemStatus = 'PENDING' | 'PREPARING' | 'READY' | 'SERVED';
export type OrderSource = 'QR_MENU' | 'POS' | 'ONLINE' | 'PHONE';
export type OrderType = 'DINE_IN' | 'PICKUP' | 'DELIVERY' | 'RESERVATION';
export type PaymentMethod = 'CASH' | 'CARD' | 'DELIVERY' | 'QR_PAY';
export type DiningTableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING';
export type StockType = 'AUTO_DEDUCT' | 'MANUAL_IN' | 'ADJUSTMENT';
export type LeaveType = 'ANNUAL' | 'SICK' | 'UNPAID' | 'EMERGENCY';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type PayrollPeriod = 'WEEKLY' | 'MONTHLY';
export type PayrollStatus = 'DRAFT' | 'APPROVED' | 'PAID';

// ============ FRONTEND-ONLY / LEGACY ENUMS ============
export type DiscountType = 'percentage' | 'fixed';
export type ReservationStatus = 'confirmed' | 'arrived' | 'cancelled' | 'no-show';
export type KitchenStatus = 'pending' | 'sent' | 'preparing' | 'done';

// ============ BASE ============
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface BaseEntityNoUpdatedAt {
  id: string;
  createdAt: string;
}

// ============ ROLE (DYNAMIC) ============
export interface Role extends BaseEntity {
  name: string;
  permissions: Record<string, boolean>;
  isActive: boolean;
  isSystem: boolean;
  staffCount?: number;
}

// ============ OUTLET ============
export interface Outlet extends BaseEntity {
  id: string;
  name: string;
  address: string;
  phone?: string;
  isActive: boolean;
  staffCount: number;
  monthlyRevenue: number;
  status: 'active' | 'inactive';
  orders?: Order[];
  staff?: Staff[];
  inventoryItems?: InventoryItem[];
}

// ============ DEPARTMENT ============
export interface Department extends BaseEntity {
  name: string;
  isActive: boolean;
  staffCount?: number;
}

// ============ MENU ITEM OPTIONS ============
export interface OptionChoice {
  id: string;
  name: string;
  priceModifier: number;
  isDefault?: boolean;
  sortOrder?: number;
}

export interface MenuItemOption {
  id: string;
  name: string;
  required: boolean;
  multiSelect: boolean;
  choices: OptionChoice[];
}

export type MenuItemOptions = MenuItemOption[];
export type ReceiptItemsSnapshot = OrderItem[];

export interface ReceiptCustomerInfo {
  name?: string;
  phone?: string;
  address?: string;
  note?: string;
}

// ============ STAFF ============
export interface Staff extends BaseEntity {
  name: string;
  email?: string;
  password?: string;
  pin: string;
  phone?: string;
  roleId?: string;
  role?: Role;
  isSuperAdmin: boolean;
  isActive: boolean;
  employmentType: EmploymentType;
  hourlyRate?: number;
  monthlySalary?: number;
  joinDate: string;
  customEpfRate?: number;
  customSocsoRate?: number;
  departmentId?: string;
  department?: Department;
  outletId?: string;
  outlet?: Outlet;
}

export interface StaffView extends Staff {
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
  price: number;
  categoryId: string;
  category?: Category;
  imageUrl?: string;
  isAvailable: boolean;
  stock: number;
  minStock: number;
  options?: MenuItemOptions;
  ingredients?: MenuItemIngredient[];
}

export interface MenuItemView extends MenuItem {
  cost?: number;
  description?: string;
  barcode?: string;
  modifiers?: string[];
}

export interface SelectedModifier {
  modifierId: string;
  name: string;
  price: number;
}

// ============ DINING TABLE ============
export interface DiningTable extends BaseEntity {
  number: string;
  capacity: number;
  status: DiningTableStatus;
}

export interface DiningTableView extends DiningTable {
  name?: string;
  currentOrderId?: string;
  isActive?: boolean;
}

// ============ CUSTOMER ============
export interface CustomerInfo {
  name: string;
  phone: string;
  address?: string;
  note?: string;
}

// ============ RESERVATION ============
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
export interface OrderItem extends BaseEntity {
  orderId: string;
  menuItemId: string;
  menuItem?: MenuItem;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  options?: MenuItemOptions;
  notes?: string;
  status: ItemStatus;
}

export interface OrderItemInput {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  options?: MenuItemOptions;
  notes?: string;
}

export interface Order extends BaseEntity {
  orderNumber: string;
  status: OrderStatus;
  source: OrderSource;
  type: OrderType;
  totalAmount: number;
  paidAmount?: number;
  taxAmount?: number;
  paymentMethod?: PaymentMethod;
  customerInfo?: CustomerInfo;
  tableId?: string;
  table?: DiningTable;
  pax?: number;
  reservationTime?: string;
  notes?: string;
  completedAt?: string;
  items: OrderItem[];
  receipt?: Receipt;
  outletId?: string;
  outlet?: Outlet;
}

export interface OrderView extends Order {
  tableNumber?: string;
  cashierId?: string;
  cashierName?: string;
  kitchenStatus?: KitchenStatus;
  subtotal?: number;
  discount?: AppliedDiscount;
  tax?: number;
  serviceCharge?: number;
  finalTotal?: number;
  payment?: Payment;
  payments?: SplitPayment[];
  orderedAt?: string;
  sentToKitchenAt?: string;
  isQrOrder?: boolean;
  qrOrderId?: string;
  originalOrderId?: string;
  movedFromTableId?: string;
  customerInfo?: CustomerInfo;
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

// ============ DRAFT ORDER ============
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

// ============ CART ITEM ============
export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  modifiers?: string[];
  options?: MenuItemOptions;
  notes?: string;
}

// ============ RECEIPT ============
export interface Receipt extends BaseEntityNoUpdatedAt {
  receiptNo: string;
  orderId: string;
  order?: Order;
  totalAmount: number;
  paidAmount: number;
  change?: number;
  paymentMethod: PaymentMethod;
  taxAmount?: number;
  cashierId: string;
  cashier?: Staff;
  posId: string;
  itemsSnapshot: ReceiptItemsSnapshot;
  customerInfo?: ReceiptCustomerInfo;
  printCount: number;
  lastPrintedAt?: string;
  pdfGeneratedAt?: string;
  pdfUrl?: string;
  emailedTo?: string;
  emailSentAt?: string;
  [key: string]: unknown;
}

export interface ReceiptView extends Receipt {
  items?: OrderItem[];
  cashierName?: string;
  tableNumber?: string;
  orderType?: OrderType;
  printedAt?: string;
  reprintCount?: number;
  lastReprintedAt?: string;
  savedAsPdf?: boolean;
}

// ============ RECEIPT SUMMARY ============
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
  staffId?: string;
  staff?: Staff;
}

export interface InventoryLog extends BaseEntity {
  menuItemId: string;
  menuItemName: string;
  action: StockType;
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
  unit: string;                    // backward compat alias for unitOfMeasure
  unitOfMeasure?: string;          // g, kg, ml, l, pcs
  weight?: number;                 // weight per pack
  currentStock: number;            // computed: close stock (for backward compat)
  minStock: number;
  costPerUnit?: number;            // backward compat alias for unitPrice
  unitPrice?: number;              // price per unit (RM per g/ml/pcs)
  packPrice?: number;              // price per pack/box
  openStock: number;               // opening stock
  stockIn: number;                  // stock received
  stockOut: number;                 // stock used/sold
  close: number;                    // computed: openStock + stockIn - stockOut
  supplier?: string;
  description?: string;
  isActive: boolean;
  outletId?: string;
  outlet?: Outlet;
  ingredients?: MenuItemIngredient[];
  stockLogs?: StockLog[];
}

export interface MenuItemIngredient {
  id: string;
  inventoryItemId?: string;        // link to raw material
  inventoryItem?: InventoryItem;
  preCookId?: string;              // link to pre-cook product
  preCook?: PreCookProduct;
  menuItemId: string;
  menuItem?: MenuItem;
  quantityUsed: number;
  unit?: string;                   // g, kg, ml, l, pcs
}

// ============ PRE-COOK / BATCH PREP ============
export interface PreCookProduct extends BaseEntity {
  name: string;
  description?: string;
  cost: number;
  isActive: boolean;
  ingredients?: PreCookIngredient[];
  menuItemIngredients?: MenuItemIngredient[];
}

export interface PreCookIngredient {
  id: string;
  preCookId: string;
  preCook?: PreCookProduct;
  inventoryItemId: string;
  inventoryItem?: InventoryItem;
  quantityUsed: number;
}

// ============ STOCK LOG (Consolidated) ============
export interface StockLog extends BaseEntityNoUpdatedAt {
  type: StockType;
  menuItemId?: string;
  menuItem?: MenuItem;
  inventoryItemId?: string;
  inventoryItem?: InventoryItem;
  quantity: number;
  orderId?: string;
  reason?: string;
  staffId?: string;
  staff?: Staff;
  outletId?: string;
  outlet?: Outlet;
  // UI convenience fields (computed)
  itemName?: string;
  staffName?: string;
}

export interface InventoryLog extends BaseEntity {
  menuItemId: string;
  menuItemName: string;
  action: StockType;
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
  orderType: 'DINE_IN' | 'PICKUP';
  items: OrderItemInput[];
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
  outletId?: string;
  outlet?: Outlet;
}

export interface AppSettings {
  posId?: string;
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
  lastSyncAt?: string;
  fallbackChannel: 'whatsapp' | 'telegram' | 'sms' | 'none';
  whatsappNumber: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  smsApiKey?: string;
  outletId?: string;
  outletName?: string;
}

// ============ API DTOs ============
export interface CreateOrderPayload {
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
  outletId?: string;
}

// ============ DYNAMIC CONFIGURATION ============
export interface Department {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface PaymentType {
  id: string;
  name: string;
  isActive: boolean;
  sortOrder?: number;
}

export interface SalesSummary {
  total: number;
  count: number;
  avg: number;
  totalItems?: number;
  totalDiscounts?: number;
}

export interface TaxRate {
  id: string;
  name: string;
  rate: number;
  isActive: boolean;
}

export interface Device {
  id: string;
  name: string;
  outlet: string;
  status: 'active' | 'inactive';
  lastSeen?: string;
  deviceType?: 'pos' | 'kds' | 'printer' | 'tablet';
}

export interface StockAdjustment {
  id: string;
  itemId: string;
  itemName: string;
  type: 'add' | 'remove' | 'adjust';
  quantity: number;
  reason: string;
  date: string;
  staffId?: string;
  staffName?: string;
}

// ============ PERMISSIONS ============
export interface PermissionDefinition {
  key: string;
  label: string;
  category: string;
}

export const DEFAULT_PERMISSIONS: PermissionDefinition[] = [
  { key: 'dashboard', label: 'Dashboard', category: 'General' },
  { key: 'sales', label: 'Sales Report', category: 'General' },
  { key: 'staff', label: 'Staff Management', category: 'Staff' },
  { key: 'payroll', label: 'Payroll', category: 'Staff' },
  { key: 'menu', label: 'Item Management', category: 'Menu' },
  { key: 'inventory', label: 'Inventory', category: 'Inventory' },
  { key: 'costing', label: 'Costing', category: 'Menu' },
  { key: 'recipes', label: 'Recipes', category: 'Menu' },
  { key: 'outlets', label: 'Outlets', category: 'General' },
  { key: 'customers', label: 'Customers', category: 'General' },
  { key: 'promotions', label: 'Promotions', category: 'General' },
  { key: 'landing_page', label: 'Landing Page', category: 'General' },
  { key: 'accounting', label: 'Accounting', category: 'Accounting' },
  { key: 'chart_of_accounts', label: 'Chart of Accounts', category: 'Accounting' },
  { key: 'journal_entries', label: 'Journal Entries', category: 'Accounting' },
  { key: 'general_ledger', label: 'General Ledger', category: 'Accounting' },
  { key: 'trial_balance', label: 'Trial Balance', category: 'Accounting' },
  { key: 'financial_reports', label: 'Financial Reports', category: 'Accounting' },
  { key: 'settings', label: 'Settings', category: 'Admin' },
];

// ============ CRM / QR MENU LANDING PAGE ============
export type PromotionType = 'BANNER' | 'POPUP' | 'DISCOUNT_PERCENT' | 'DISCOUNT_FIXED' | 'FREE_ITEM' | 'BUNDLE';
export type PromotionTarget = 'ALL' | 'NEW_CUSTOMER' | 'RETURNING' | 'VIP';

export interface Customer extends BaseEntity {
  name: string;
  phone: string;
  email?: string;
  visits: number;
  points: number;
  totalSpent: number;
  lastVisit?: string;
  isVip: boolean;
  orders?: Order[];
  redemptions?: Redemption[];
}

export interface Redemption extends BaseEntityNoUpdatedAt {
  customerId: string;
  customer?: Customer;
  pointsUsed: number;
  reward: string;
  orderId?: string;
}

export interface Promotion {
  id: string;
  title: string;
  description?: string;
  type: PromotionType;
  bannerUrl?: string;
  discount?: number;
  minSpend?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  outletId: string;
  target: PromotionTarget;
  priority: number;
  createdAt: string;
}

export interface CreateCustomerPayload {
  name: string;
  phone: string;
  email?: string;
}

export interface UpdateCustomerPayload {
  name?: string;
  email?: string;
  points?: number;
  isVip?: boolean;
}

export interface CreatePromotionPayload {
  title: string;
  description?: string;
  type: PromotionType;
  bannerUrl?: string;
  discount?: number;
  minSpend?: number;
  startDate: string;
  endDate: string;
  isActive?: boolean;
  outletId: string;
  target?: PromotionTarget;
  priority?: number;
}

export interface UpdatePromotionPayload {
  title?: string;
  description?: string;
  type?: PromotionType;
  bannerUrl?: string;
  discount?: number;
  minSpend?: number;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  target?: PromotionTarget;
  priority?: number;
}

export interface LoyaltyRedeemOption {
  points: number;
  value: number;
  label: string;
}

export interface LoyaltyRedeemPayload {
  points: number;
  reward: string;
  orderId?: string;
}

// ============ LANDING PAGE CMS ============
export interface LandingPageContent extends BaseEntity {
  section: string;
  key: string;
  content: Record<string, any>;
  sortOrder: number;
  isActive: boolean;
  outletId?: string;
}

export interface LandingPageContentInput {
  section: string;
  key: string;
  content: Record<string, any>;
  sortOrder?: number;
  isActive?: boolean;
  outletId?: string;
}

export interface LandingPageContentUpdate {
  content?: Record<string, any>;
  sortOrder?: number;
  isActive?: boolean;
}

export interface LandingPagePublicData {
  [section: string]: Array<{
    key: string;
    content: Record<string, any>;
    sortOrder: number;
  }>;
}

export interface HeroContent {
  title: string;
  tagline: string;
  subtitle: string;
  ctaText: string;
  gradient: string;
}

export interface FeatureContent {
  icon: string;
  title: string;
  description: string;
}

export interface FooterContent {
  text: string;
  showLogo: boolean;
}

// ============ ACCOUNTING ============
export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

export interface Account extends BaseEntity {
  code: string;
  name: string;
  type: AccountType;
  description?: string;
  parentId?: string;
  parent?: Account;
  children?: Account[];
  outletId?: string;
  outlet?: Outlet;
  isActive: boolean;
  isPreset: boolean;
}

export interface JournalLine {
  id: string;
  journalEntryId: string;
  accountId: string;
  account?: Account;
  description?: string;
  debit: number;
  credit: number;
  createdAt: string;
}

export interface JournalEntry extends BaseEntity {
  date: string;
  reference?: string;
  description: string;
  outletId?: string;
  orderId?: string;
  payrollId?: string;
  receiptId?: string;
  createdById?: string;
  createdBy?: { id: string; name: string };
  isAutoGenerated: boolean;
  isPosted: boolean;
  postedAt?: string;
  lines: JournalLine[];
}

export interface TrialBalanceRow {
  code: string;
  name: string;
  type: AccountType;
  debits: number;
  credits: number;
  balance: number;
}

export interface TrialBalance {
  asOf: string;
  rows: TrialBalanceRow[];
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
}

export interface LedgerLine {
  date: string;
  reference?: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface GeneralLedger {
  account: {
    code: string;
    name: string;
    type: AccountType;
  };
  from: string | null;
  to: string | null;
  lines: LedgerLine[];
  openingBalance: number;
  closingBalance: number;
}

export interface CreateAccountPayload {
  code: string;
  name: string;
  type: AccountType;
  description?: string;
  parentId?: string;
  outletId?: string;
}

export interface UpdateAccountPayload {
  code?: string;
  name?: string;
  type?: AccountType;
  description?: string;
  parentId?: string;
  isActive?: boolean;
}

export interface JournalLinePayload {
  accountId: string;
  description?: string;
  debit?: number;
  credit?: number;
}

export interface CreateJournalEntryPayload {
  date?: string;
  reference?: string;
  description: string;
  outletId?: string;
  lines: JournalLinePayload[];
}

export interface PostJournalPayload {
  id: string;
}

export interface TrialBalanceQuery {
  outletId?: string;
  asOf?: string;
}

export interface LedgerQuery {
  accountId: string;
  from?: string;
  to?: string;
}