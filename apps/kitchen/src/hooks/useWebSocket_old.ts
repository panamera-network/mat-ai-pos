// apps/kitchen/src/hooks/useWebSocket.ts
import { useEffect, useRef, useCallback, useState } from 'react';
import { MATaiWSClient } from '@mat-ai/ws';
import type { WSMessage } from '@mat-ai/ws';
import { getSettings } from '../utils/storage';

export function useKitchenWebSocket(
  onNewOrder: (msg: WSMessage) => void,
  onOrderUpdated: (msg: WSMessage) => void,
  onItemDone: (msg: WSMessage) => void,
  onOrderDone: (msg: WSMessage) => void,
) {
  const clientRef = useRef<MATaiWSClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    const settings = getSettings();
    const url = `ws://${settings.posIp}:${settings.posPort}`;

    const client = new MATaiWSClient({
      url,
      stationName: 'KDS',
      categories: [],
      onConnect: () => setIsConnected(true),
      onDisconnect: () => setIsConnected(false),
      onError: () => setIsConnected(false),
    });

    client.on('NEW_ORDER', onNewOrder);
    client.on('ORDER_CREATED', onNewOrder);
    client.on('ORDER_UPDATED', onOrderUpdated);
    client.on('ITEM_DONE', onItemDone);
    client.on('ORDER_DONE', onOrderDone);

    client.connect();
    clientRef.current = client;
  }, [onNewOrder, onOrderUpdated, onItemDone, onOrderDone]);

  const disconnect = useCallback(() => {
    clientRef.current?.disconnect();
    clientRef.current = null;
    setIsConnected(false);
  }, []);

  const sendItemDone = useCallback((orderId: string, itemIndex: number) => {
    return clientRef.current?.itemDone(orderId, itemIndex) ?? false;
  }, []);

  const sendOrderDone = useCallback((orderId: string) => {
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
    sendOrderDone,
  };
}