// src/common/enums.ts
export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PREPARING = 'PREPARING',
  READY = 'READY',
  SERVED = 'SERVED',
  CANCELLED = 'CANCELLED',
}

export enum ItemStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  READY = 'READY',
  SERVED = 'SERVED',
}

export enum OrderSource {
  QR_MENU = 'QR_MENU',
  POS = 'POS',
  ONLINE = 'ONLINE',
  PHONE = 'PHONE',
}

export enum OrderType {
  DINE_IN = 'DINE_IN',
  PICKUP = 'PICKUP',
  DELIVERY = 'DELIVERY',
  RESERVATION = 'RESERVATION',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  EWALLET = 'EWALLET',
  QR_PAY = 'QR_PAY',
}

export enum TableStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
  CLEANING = 'CLEANING',
}