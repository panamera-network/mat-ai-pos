import Dexie from 'dexie';
import type {
  Staff,
  Timecard,
  Category,
  MenuItem,
  DiningTable,
  Reservation,
  Station,
  Order,
  Receipt,
  InventoryLog,
  LowStockAlert,
  SyncLog,
  AppSettings,
  QrOrder,
  RefundRequest,
  VoidRecord,
  StockType,
} from '@mat-ai/types';

export class MATaiDatabase extends Dexie {
  staff!: Dexie.Table<Staff, string>;
  timecards!: Dexie.Table<Timecard, string>;
  categories!: Dexie.Table<Category, string>;
  menuItems!: Dexie.Table<MenuItem, string>;
  diningTables!: Dexie.Table<DiningTable, string>;
  reservations!: Dexie.Table<Reservation, string>;
  stations!: Dexie.Table<Station, string>;
  orders!: Dexie.Table<Order, string>;
  receipts!: Dexie.Table<Receipt, string>;
  inventoryLogs!: Dexie.Table<InventoryLog, string>;
  lowStockAlerts!: Dexie.Table<LowStockAlert, string>;
  syncLogs!: Dexie.Table<SyncLog, string>;
  settings!: Dexie.Table<AppSettings & { id: number }, number>;
  qrOrders!: Dexie.Table<QrOrder, string>;
  refundRequests!: Dexie.Table<RefundRequest, string>;
  voidRecords!: Dexie.Table<VoidRecord, string>;

  constructor() {
    super('MATaiPOS');

    this.version(1).stores({
      staff: 'id, name, pin, role, isActive',
      timecards: 'id, staffId, clockIn, clockOut',
      categories: 'id, name, sortOrder, isActive',
      menuItems: 'id, name, categoryId, isAvailable, stock',
      diningTables: 'id, number, status',
      reservations: 'id, date, time, status, tableId',
      stations: 'id, name, ipAddress, isActive',
      orders: 'id, status, tableId, createdAt',
      receipts: 'id, receiptNo, orderId',
      inventoryLogs: 'id, menuItemId, action, timestamp',
      lowStockAlerts: 'id, menuItemId, acknowledged, alertTime',
      syncLogs: 'id, type, status, startedAt',
      settings: '++id',
      qrOrders: 'id, status, tableId, sessionId',
      refundRequests: 'id, orderId, status, requestedBy',
      voidRecords: 'id, orderId, voidedBy, timestamp',
    });
  }
}

export const db = new MATaiDatabase();
export { Dexie } from 'dexie';

export function getTable(name: string): Dexie.Table<any, string> | undefined {
  return (db as any)[name];
}

// Initialize default settings
export async function initDefaultSettings(): Promise<void> {
  const count = await db.settings.count();
  if (count === 0) {
    await db.settings.add({
      posId: 'POS-1',
      posName: 'MAT.ai POS',
      receiptHeader: 'MAT.ai POS\nThank you for dining with us!',
      receiptFooter: 'Please come again!\nFollow us @mataipos',
      taxEnabled: true,
      taxRate: 0.08,
      serviceChargeEnabled: false,
      serviceChargeRate: 0.10,
      printerIp: '192.168.1.100',
      printerPort: 9100,
      printerEnabled: true,
      orderSlipEnabled: false,
      kitchenDisplayIp: '192.168.1.101',
      kitchenDisplayPort: 8080,
      autoSync: false,
      syncInterval: 30,
      qrBaseUrl: 'https://qr.mataipos.com',
      currency: 'MYR',
      language: 'ms',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: 'HH:mm',
    } as AppSettings & { id: number });
  }
}

// Inventory helpers
export async function updateStock(
  menuItemId: string,
  qty: number,
  action: StockType,
  reason: string,
  staffId: string,
  staffName: string
): Promise<void> {
  const item = await db.menuItems.get(menuItemId);
  if (!item) throw new Error('Menu item not found');

  const previousStock = item.stock;
  let newStock: number;

  switch (action) {
    case 'AUTO_DEDUCT':
      newStock = previousStock - qty;
      break;
    case 'MANUAL_IN':
      newStock = previousStock + qty;
      break;
    case 'ADJUSTMENT':
      newStock = qty;
      break;
    default:
      throw new Error('Invalid action');
  }

  if (newStock < 0) throw new Error('Insufficient stock');

  await db.menuItems.update(menuItemId, { stock: newStock });

  await db.inventoryLogs.add({
    id: crypto.randomUUID(),
    menuItemId,
    menuItemName: item.name,
    action,
    qty,
    previousStock,
    newStock,
    reason,
    staffId,
    staffName,
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Check low stock
  if (newStock <= item.minStock) {
    await db.lowStockAlerts.add({
      id: crypto.randomUUID(),
      menuItemId,
      menuItemName: item.name,
      currentStock: newStock,
      minStock: item.minStock,
      alertTime: new Date().toISOString(),
      acknowledged: false,
    });
  }
}

export * from 'dexie';