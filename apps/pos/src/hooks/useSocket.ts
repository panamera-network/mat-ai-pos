// apps/pos/src/hooks/useSocket.ts
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:4000';

export function useSocket(room: string) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 POS connected:', socket.id);
      setConnected(true);
      socket.emit('joinRoom', room);
    });

    socket.on('disconnect', () => {
      console.log('🔌 POS disconnected');
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('❌ Socket error:', err.message);
    });

    return () => {
      socket.emit('leaveRoom', room);
      socket.disconnect();
    };
  }, [room]);

  return { socket: socketRef.current, connected };
}