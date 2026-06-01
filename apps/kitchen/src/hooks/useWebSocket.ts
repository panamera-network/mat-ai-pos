// apps/kitchen/src/hooks/useWebSocket.ts
import { useEffect, useRef, useCallback, useState } from 'react';
import { MATaiWSClient } from '@mat-ai/ws';
import type { WSMessage } from '@mat-ai/ws';
import { getSettings } from '../utils/storage';
import { MockWebSocketServer } from '../utils/mockWebSocket';

export function useKitchenWebSocket(
  onOrderCreated: (msg: WSMessage) => void,
  onOrderUpdated: (msg: WSMessage) => void,
  onItemDone: (msg: WSMessage) => void,
  onOrderDone: (msg: WSMessage) => void,
  useMock = false
) {
  const clientRef = useRef<MATaiWSClient | null>(null);
  const mockRef = useRef<MockWebSocketServer | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    if (useMock) {
      // Use mock server for demo
      const mock = new MockWebSocketServer();
      mock.onMessage((msg) => {
        if (msg.type === 'ORDER_CREATED') onOrderCreated(msg);
        if (msg.type === 'ORDER_UPDATED') onOrderUpdated(msg);
        if (msg.type === 'ITEM_DONE') onItemDone(msg);
        if (msg.type === 'ORDER_DONE') onOrderDone(msg);
      });
      mock.connect();
      mockRef.current = mock;
      setIsConnected(true);
      return;
    }

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

    client.on('ORDER_CREATED', onOrderCreated);
    client.on('ORDER_UPDATED', onOrderUpdated);
    client.on('ITEM_DONE', onItemDone);
    client.on('ORDER_DONE', onOrderDone);

    client.connect();
    clientRef.current = client;
  }, [useMock, onOrderCreated, onOrderUpdated, onItemDone, onOrderDone]);

  const disconnect = useCallback(() => {
    if (useMock) {
      mockRef.current?.disconnect();
      mockRef.current = null;
    } else {
      clientRef.current?.disconnect();
      clientRef.current = null;
    }
    setIsConnected(false);
  }, [useMock]);

  const sendItemDone = useCallback((orderId: string, itemIndex: number) => {
    if (useMock) {
      mockRef.current?.send({
        type: 'ITEM_DONE',
        payload: { orderId, itemIndex, stationId: 'mock' },
        timestamp: new Date().toISOString(),
      });
      return true;
    }
    return clientRef.current?.itemDone(orderId, itemIndex) ?? false;
  }, [useMock]);

  const sendOrderDone = useCallback((orderId: string) => {
    if (useMock) {
      mockRef.current?.send({
        type: 'ORDER_DONE',
        payload: { orderId, stationId: 'mock', completedAt: new Date().toISOString() },
        timestamp: new Date().toISOString(),
      });
      return true;
    }
    return clientRef.current?.orderDone(orderId) ?? false;
  }, [useMock]);

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
