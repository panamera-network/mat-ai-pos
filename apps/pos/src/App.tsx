//apps/pos/src/App.tsx
import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { wsClient } from './lib/ws';
import { MainPage } from './pages/MainPage';
import { Dashboard } from './pages/Dashboard';
import { POSPage } from './pages/POSPage';
import { PaymentPage } from './pages/PaymentPage';
import { ReceiptHistoryPage } from './pages/ReceiptHistoryPage';
import { MenuEditPage } from './pages/MenuEditPage';
import { InventoryPage } from './pages/InventoryPage';
import { SettingsPage } from './pages/SettingsPage';

const App: React.FC = () => {
  useEffect(() => {
    // Connect to KDS / WS server (default: localhost:8080 atau dari settings)
    const stations = JSON.parse(localStorage.getItem('mat-pos-stations') || '[]');
    const defaultKds = stations.find((s: any) => s.type === 'kds' && s.enabled);
    const wsUrl = defaultKds
      ? `ws://${defaultKds.ip}:${defaultKds.port}`
      : localStorage.getItem('mat-pos-ws-url') || 'ws://localhost:8080';

    wsClient.connect();

    return () => {
      wsClient.disconnect();
    };
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-100">
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/pos" element={<POSPage />} />
        <Route path="/payment/:orderId" element={<PaymentPage />} />
        <Route path="/receipts" element={<ReceiptHistoryPage />} />
        <Route path="/menu" element={<MenuEditPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </div>
  );
};

export default App;