export type Order = {
  id: string;
  orderNumber?: string | null;
  status?: string | null;
  type?: string | null;
  totalAmount?: number | string | null;
  createdAt?: string | null;
  table?: { number?: string | number | null; name?: string | null } | null;
  tableId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  deliveryAddress?: string | null;
  reservationTime?: string | null;
  items?: Array<{ id?: string; name?: string; quantity?: number; totalPrice?: number | string | null }>;
};

export type StaffMember = {
  id: string;
  name?: string | null;
  role?: string | { name?: string | null } | null;
  employmentType?: string | null;
  isActive?: boolean | null;
  hourlyRate?: number | string | null;
  monthlySalary?: number | string | null;
};

export type InventoryItem = {
  id: string;
  name?: string | null;
  category?: string | null;
  unit?: string | null;
  currentStock?: number | string | null;
  minStock?: number | string | null;
  costPerUnit?: number | string | null;
  unitPrice?: number | string | null;
};

export type StockLog = {
  id: string;
  type?: string | null;
  quantity?: number | string | null;
  reason?: string | null;
  createdAt?: string | null;
  inventoryItem?: { name?: string | null } | null;
  menuItem?: { name?: string | null } | null;
};

export type Timecard = {
  id: string;
  clockIn?: string | null;
  clockOut?: string | null;
  totalHours?: number | string | null;
  staff?: { name?: string | null } | null;
};

export type Payroll = {
  id: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  basicPay?: number | string | null;
  totalDeductions?: number | string | null;
  nettPay?: number | string | null;
  status?: string | null;
  staff?: { name?: string | null } | null;
};

export type Table = {
  id: string;
  number?: string | number | null;
  name?: string | null;
  status?: string | null;
};

export async function readJson<T>(response: Response, fallback: T): Promise<T> {
  if (!response.ok) return fallback;
  try {
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

export function money(value: number | string | null | undefined) {
  return `RM${toNumber(value).toFixed(2)}`;
}

export function toNumber(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

export function isToday(date?: string | null) {
  if (!date) return false;
  return new Date(date).toDateString() === new Date().toDateString();
}

export function withinDays(date: string | null | undefined, days: number) {
  if (!date) return false;
  const created = new Date(date).getTime();
  if (!Number.isFinite(created)) return false;
  return created >= Date.now() - days * 24 * 60 * 60 * 1000;
}

export function isPaidOrder(order: Order) {
  return order.status === 'PAID' || order.status === 'SERVED';
}

export function isOpenOrder(order: Order) {
  return !['PAID', 'CANCELLED', 'VOID'].includes(String(order.status ?? ''));
}

export function displayRole(staff: StaffMember) {
  if (typeof staff.role === 'string') return staff.role;
  return staff.role?.name ?? '-';
}

export function formatDateTime(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function compactLabel(value?: string | null) {
  return String(value ?? '-').replace(/_/g, ' ');
}
