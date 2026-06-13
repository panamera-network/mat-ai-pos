// packages/ws/src/protocol.ts
// MAT.ai POS WebSocket Protocol

import type { Order, KitchenStatus } from '@mat-ai/types';

// ============ MESSAGE TYPES ============

export type WSMessageType =
  | 'NEW_ORDER'        // ← ADDED: POS broadcast new order to KDS
  | 'ORDER_CREATED'    // Server confirms order creation
  | 'ORDER_UPDATED'
  | 'ITEM_DONE'
  | 'ORDER_DONE'
  | 'ITEM_UNDONE'
  | 'STATION_REGISTER'
  | 'STATION_UNREGISTER'
  | 'PING'
  | 'PONG'
  | 'ERROR';

export interface WSMessage<T = unknown> {
  type: WSMessageType;
  payload: T;
  timestamp: string;
  stationId?: string;
}

// ============ PAYLOAD TYPES ============

export interface NewOrderPayload {
  order: Order;
}

export interface OrderCreatedPayload {
  order: Order;
}

export interface OrderUpdatedPayload {
  orderId: string;
  status: KitchenStatus;
  kitchenStatus: KitchenStatus;
}

export interface ItemDonePayload {
  orderId: string;
  itemIndex: number;
  stationId: string;
}

export interface OrderDonePayload {
  orderId: string;
  stationId: string;
  completedAt: string;
}

export interface ItemUndonePayload {
  orderId: string;
  itemIndex: number;
  stationId: string;
}

export interface StationRegisterPayload {
  stationName: string;
  categories: string[];
  deviceType: 'tablet' | 'ipad' | 'android' | 'desktop';
}

export interface StationUnregisterPayload {
  stationId: string;
}

export interface ErrorPayload {
  code: string;
  message: string;
}

// ============ TYPE GUARDS ============

export const isNewOrder = (msg: WSMessage): msg is WSMessage<NewOrderPayload> =>
  msg.type === 'NEW_ORDER';

export const isOrderCreated = (msg: WSMessage): msg is WSMessage<OrderCreatedPayload> =>
  msg.type === 'ORDER_CREATED';

export const isOrderUpdated = (msg: WSMessage): msg is WSMessage<OrderUpdatedPayload> =>
  msg.type === 'ORDER_UPDATED';

export const isItemDone = (msg: WSMessage): msg is WSMessage<ItemDonePayload> =>
  msg.type === 'ITEM_DONE';

export const isItemUndone = (msg: WSMessage): msg is WSMessage<ItemUndonePayload> =>
  msg.type === 'ITEM_UNDONE';

export const isOrderDone = (msg: WSMessage): msg is WSMessage<OrderDonePayload> =>
  msg.type === 'ORDER_DONE';

export const isStationRegister = (msg: WSMessage): msg is WSMessage<StationRegisterPayload> =>
  msg.type === 'STATION_REGISTER';

// ============ MESSAGE BUILDERS ============

export const createMessage = <T>(
  type: WSMessageType,
  payload: T,
  stationId?: string
): WSMessage<T> => ({
  type,
  payload,
  timestamp: new Date().toISOString(),
  stationId,
});

export const createNewOrder = (order: Order): WSMessage<NewOrderPayload> =>
  createMessage('NEW_ORDER', { order });

export const createOrderCreated = (order: Order): WSMessage<OrderCreatedPayload> =>
  createMessage('ORDER_CREATED', { order });

export const createOrderUpdated = (
  orderId: string,
  status: KitchenStatus,
  kitchenStatus: KitchenStatus
): WSMessage<OrderUpdatedPayload> =>
  createMessage('ORDER_UPDATED', { orderId, status, kitchenStatus });

export const createItemDone = (
  orderId: string,
  itemIndex: number,
  stationId: string
): WSMessage<ItemDonePayload> =>
  createMessage('ITEM_DONE', { orderId, itemIndex, stationId }, stationId);

export const createOrderDone = (
  orderId: string,
  stationId: string
): WSMessage<OrderDonePayload> =>
  createMessage('ORDER_DONE', { orderId, stationId, completedAt: new Date().toISOString() }, stationId);

export const createItemUndone = (
  orderId: string,
  itemIndex: number,
  stationId: string
): WSMessage<ItemUndonePayload> =>
  createMessage('ITEM_UNDONE', { orderId, itemIndex, stationId }, stationId);

  export const createStationRegister = (
  stationName: string,
  categories: string[],
  deviceType: 'tablet' | 'ipad' | 'android' | 'desktop' = 'tablet'
): WSMessage<StationRegisterPayload> =>
  createMessage('STATION_REGISTER', { stationName, categories, deviceType });

export const createPing = (): WSMessage<null> =>
  createMessage('PING', null);

export const createPong = (): WSMessage<null> =>
  createMessage('PONG', null);