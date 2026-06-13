// apps/kitchen/src/hooks/useKitchenWebSocket.ts
// Refactored: Type-safe WS hook using @mat-ai/ws with ITEM_UNDONE support

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  MATaiWSClient,
  createWSClient,
  isNewOrder,
  isOrderCreated,
  isOrderUpdated,
  isItemDone,
  isItemUndone,
  isOrderDone,
  type WSMessage,
  type NewOrderPayload,
  type OrderCreatedPayload,
  type OrderUpdatedPayload,
  type ItemDonePayload,
  type ItemUndonePayload,
  type OrderDonePayload,
} from '@mat-ai/ws';
import { getSettings } from '../utils/storage';

export interface KitchenWSHandlers {
  onNewOrder: (msg: WSMessage<NewOrderPayload>) => void;
  onOrderCreated: (msg: WSMessage<OrderCreatedPayload>) => void;
  onOrderUpdated: (msg: WSMessage<OrderUpdatedPayload>) => void;
  onItemDone: (msg: WSMessage<ItemDonePayload>) => void;
  onItemUndone: (msg: WSMessage<ItemUndonePayload>) => void;
  onOrderDone: (msg: WSMessage<OrderDonePayload>) => void;
}

export function useKitchenWebSocket(handlers: KitchenWSHandlers) {
  const clientRef = useRef<MATaiWSClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const handlersRef = useRef(handlers);

  handlersRef.current = handlers;

  const connect = useCallback(() => {
    const settings = getSettings();
    const url = `ws://${settings.posIp}:${settings.posPort}`;

    const client = createWSClient({
      url,
      stationName: settings.stationName || 'KDS',
      categories: [],
      deviceType: 'tablet',
      onConnect: () => setIsConnected(true),
      onDisconnect: () => setIsConnected(false),
      onError: () => setIsConnected(false),
    });

    client.on('NEW_ORDER', (msg) => {
      if (isNewOrder(msg)) handlersRef.current.onNewOrder(msg);
    });
    client.on('ORDER_CREATED', (msg) => {
      if (isOrderCreated(msg)) handlersRef.current.onOrderCreated(msg);
    });
    client.on('ORDER_UPDATED', (msg) => {
      if (isOrderUpdated(msg)) handlersRef.current.onOrderUpdated(msg);
    });
    client.on('ITEM_DONE', (msg) => {
      if (isItemDone(msg)) handlersRef.current.onItemDone(msg);
    });
    client.on('ITEM_UNDONE', (msg) => {
      if (isItemUndone(msg)) handlersRef.current.onItemUndone(msg);
    });
    client.on('ORDER_DONE', (msg) => {
      if (isOrderDone(msg)) handlersRef.current.onOrderDone(msg);
    });

    client.connect();
    clientRef.current = client;
  }, []);

  const disconnect = useCallback(() => {
    clientRef.current?.disconnect();
    clientRef.current = null;
    setIsConnected(false);
  }, []);

  const sendItemDone = useCallback((orderId: string, itemIndex: number): boolean => {
    return clientRef.current?.itemDone(orderId, itemIndex) ?? false;
  }, []);

  const sendItemUndone = useCallback((orderId: string, itemIndex: number): boolean => {
    return clientRef.current?.itemUndone(orderId, itemIndex) ?? false;
  }, []);

  const sendOrderDone = useCallback((orderId: string): boolean => {
    return clientRef.current?.orderDone(orderId) ?? false;
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    isConnected,
    connect,
    disconnect,
    sendItemDone,
    sendItemUndone,
    sendOrderDone,
  };
}