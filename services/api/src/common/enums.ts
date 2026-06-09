// services/api/src/common/enums.ts

// Re-export all Prisma enums — single source of truth
export {
  Role,
  EmploymentType,
  OrderStatus,
  ItemStatus,
  OrderSource,
  OrderType,
  PaymentMethod,
  TableStatus,
  StockType,
  LeaveType,
  LeaveStatus,
  PayrollPeriod,
  PayrollStatus,
} from '@prisma/client';

// Custom enums (not in Prisma schema)
export enum KitchenStatus {
  PENDING = 'pending',
  SENT = 'sent',
  PREPARING = 'preparing',
  DONE = 'done',
}

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export enum ReservationStatus {
  CONFIRMED = 'confirmed',
  ARRIVED = 'arrived',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no-show',
}