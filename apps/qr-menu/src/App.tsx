import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { OrderTypePage } from './pages/OrderTypePage';
import { MenuPage } from './pages/MenuPage';
import { CartPage } from './pages/CartPage';
import { OrderStatusPage } from './pages/OrderStatusPage';
import { ReceiptPage } from './pages/ReceiptPage';

const App: React.FC = () => {
  // Load menu data from localStorage (synced from POS settings)
  useEffect(() => {
    const menuItems = localStorage.getItem('mat-pos-menu-items');
    const categories = localStorage.getItem('mat-pos-categories');

    if (!menuItems) {
      console.warn('[QR] No menu found. Open POS Settings to configure menu first.');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<OrderTypePage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/status/:orderId" element={<OrderStatusPage />} />
        <Route path="/receipt/:orderId" element={<ReceiptPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default App;
