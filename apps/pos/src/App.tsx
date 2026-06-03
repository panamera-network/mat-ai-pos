import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { wsClient } from './lib/ws';
import { usePOSStore } from './stores/posStore';
import { MainPage } from './pages/MainPage';
import { Dashboard } from './pages/Dashboard';
import { POSPage } from './pages/POSPage';
import { PaymentPage } from './pages/PaymentPage';
import { ReceiptHistoryPage } from './pages/ReceiptHistoryPage';
import { MenuEditPage } from './pages/MenuEditPage';
import { InventoryPage } from './pages/InventoryPage';
import { SettingsPage } from './pages/SettingsPage';

const App: React.FC = () => {
  const { addNotification } = usePOSStore();

  useEffect(() => {
    // Connect to KDS / WS server
    wsClient.connect();

    // Listen for QR Menu orders
    const unsubscribe = wsClient.on('NEW_ORDER', (msg) => {
      const order = msg.payload;

      // Save to active orders
      const existing = JSON.parse(localStorage.getItem('mat-pos-active-orders') || '[]');
      existing.push(order);
      localStorage.setItem('mat-pos-active-orders', JSON.stringify(existing));

      // Show notification
      addNotification({
        message: `New QR Order: ${order.orderNumber || order.id} - ${order.customerName || 'Guest'}`,
        type: 'success',
      });

      // Play sound (optional)
      try {
        const audio = new Audio('/notification.mp3');
        audio.play().catch(() => {});
      } catch {
        // Ignore audio errors
      }
    });

    return () => {
      unsubscribe();
      wsClient.disconnect();
    };
  }, [addNotification]);

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
