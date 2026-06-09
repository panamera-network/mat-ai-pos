// useSocket.ts
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4000';

export function useSocket(room: string) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const isMounted = useRef(false);

    useEffect(() => {
      if (isMounted.current) return;
      isMounted.current = true;
      // Prevent duplicate connection (React Strict Mode)
      

    const socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 5000,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Admin connected:', socket.id);
      setConnected(true);
      socket.emit('joinRoom', room);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Admin disconnected:', reason);
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.warn('⚠️ Socket error:', err.message);
      setConnected(false);
    });

    return () => {
      if (socket.connected) {
        socket.emit('leaveRoom', room);
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [room]);

  return { socket: socketRef.current, connected };
}