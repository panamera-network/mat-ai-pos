// packages/ws/src/index.ts
// ENHANCED — all exports including type guards

export { MATaiWSClient, createWSClient } from './client';
export type { WSClientOptions } from './client';
export { MATaiWSServer } from './server';
export type { WSServerOptions, ConnectedStation } from './server';
export {
  createNewOrder,
  createStationRegister,
  createOrderCreated,
  createOrderUpdated,
  createItemDone,
  createItemUndone,
  createOrderDone,
  createPing,
  createPong,
} from './protocol';
export type {
  WSMessage,
  WSMessageType,
  NewOrderPayload,
  StationRegisterPayload,
  OrderCreatedPayload,
  OrderUpdatedPayload,
  ItemDonePayload,
  ItemUndonePayload,
  OrderDonePayload,
} from './protocol';

// Type guards — NEW exports for type-safe message handling
export {
  isNewOrder,
  isOrderCreated,
  isOrderUpdated,
  isItemDone,
  isOrderDone,
  isItemUndone,
  isStationRegister,
} from './protocol';