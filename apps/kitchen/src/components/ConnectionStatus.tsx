// apps/kitchen/src/components/ConnectionStatus.tsx
import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  stationName: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ isConnected, stationName }) => {
  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
        isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
      }`}>
        {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
        {isConnected ? 'Connected' : 'Disconnected'}
      </div>
      <span className="text-sm text-gray-500">{stationName}</span>
    </div>
  );
};
