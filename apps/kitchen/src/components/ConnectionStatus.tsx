// apps/kitchen/src/components/ConnectionStatus.tsx
import React from 'react';
import { StatusBadge } from '@mat-ai/ui';

interface ConnectionStatusProps {
  isConnected: boolean;
  stationName: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ isConnected, stationName }) => {
  return (
    <div className="flex items-center gap-2">
      <StatusBadge
        status={isConnected ? 'online' : 'offline'}
        label={isConnected ? 'Connected' : 'Disconnected'}
        size="sm"
        pulse={isConnected}
      />
      <span className="text-sm text-gray-500 dark:text-gray-400">{stationName}</span>
    </div>
  );
};
