// App.tsx
import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { OrderTypePage } from './pages/OrderTypePage';
import { MenuPage } from './pages/MenuPage';
import { CartPage } from './pages/CartPage';
import { OrderStatusPage } from './pages/OrderStatusPage';
import { ReceiptPage } from './pages/ReceiptPage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const App: React.FC = () => {
  useEffect(() => {
    fetch(`${API_URL}/menu-items`)
      .then(res => res.json())
      .then(data => {
        if (!data || data.length === 0) {
          console.warn('[QR] No menu found. Admin need to configure menu first.');
        }
      })
      .catch(err => {
        console.error('[QR] Failed to load menu:', err);
      });
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