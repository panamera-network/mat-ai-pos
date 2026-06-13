// packages/sync/src/hooks/useSync.ts
// ============================================================
// React hook for sync operations
// Provides sync trigger, status, and auto-sync
// ============================================================

import { useCallback, useEffect, useRef } from 'react';
import { useSyncStore, useSyncOnline, useSyncing, usePendingCount } from '../state';
import { SyncEngine } from '../engine';
import { SocketIOTransport } from '../transport/socket-io';
import { HttpTransport } from '../transport/http';
import type { SyncConfig, SyncResult, SyncTransport } from '../types';
import { syncQueue } from '../queue';

export interface UseSyncOptions {
  config: SyncConfig;
  transportType?: 'socketio' | 'http';
  onSyncComplete?: (result: SyncResult) => void;
  onError?: (error: Error) => void;
}

export function useSync(options: UseSyncOptions) {
  const engineRef = useRef<SyncEngine | null>(null);
  const transportRef = useRef<SyncTransport | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isOnline = useSyncOnline();
  const isSyncing = useSyncing();
  const pendingCount = usePendingCount();
  const { setOnline, setPendingCount, setFailedCount } = useSyncStore();

  // Initialize transport and engine
  useEffect(() => {
    const { config, transportType = 'socketio' } = options;

    // Create transport
    let transport: SyncTransport;
    if (transportType === 'socketio') {
      transport = new SocketIOTransport({
        serverUrl: config.serverUrl,
        authToken: config.authToken,
        posId: config.posId,
        deviceId: config.deviceId,
      });
    } else {
      transport = new HttpTransport({
        baseUrl: config.serverUrl,
        authToken: config.authToken,
        posId: config.posId,
        deviceId: config.deviceId,
      });
    }

    transportRef.current = transport;

    // Create engine
    const engine = new SyncEngine({
      transport,
      onStateChange: (state) => {
        setOnline(state.isOnline);
        setPendingCount(state.pendingCount);
        setFailedCount(state.failedCount);
      },
      onError: (error) => {
        console.error('[Sync Hook]', error);
        options.onError?.(error);
      },
      onSyncComplete: (result) => {
        options.onSyncComplete?.(result);
      },
    });

    engineRef.current = engine;

    // Connect transport
    transport.connect();

    // Handle online/offline
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      transport.disconnect();
      engine.abort();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []); // Run once on mount

  // Auto-sync interval
  useEffect(() => {
    if (!options.config.autoSync || !isOnline) return;

    intervalRef.current = setInterval(() => {
      if (!isSyncing && pendingCount > 0) {
        sync();
      }
    }, options.config.syncInterval * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isOnline, isSyncing, pendingCount, options.config.autoSync, options.config.syncInterval]);

  // Manual sync trigger
  const sync = useCallback(async (): Promise<SyncResult> => {
    if (!engineRef.current) {
      return {
        success: false,
        pushed: 0,
        pulled: 0,
        conflicts: 0,
        errors: ['Engine not initialized'],
        startedAt: new Date().toISOString(),
      };
    }

    return engineRef.current.sync();
  }, []);

  // Force sync (ignore checks)
  const forceSync = useCallback(async (): Promise<SyncResult> => {
    if (!transportRef.current) {
      return {
        success: false,
        pushed: 0,
        pulled: 0,
        conflicts: 0,
        errors: ['Transport not initialized'],
        startedAt: new Date().toISOString(),
      };
    }

    // Reconnect if needed
    if (!transportRef.current.isConnected()) {
      transportRef.current.connect();
    }

    return sync();
  }, [sync]);

  // Get queue stats
  const getStats = useCallback(async () => {
    return syncQueue.getStats();
  }, []);

  return {
    sync,
    forceSync,
    isOnline,
    isSyncing,
    pendingCount,
    getStats,
  };
}