import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CustomerProvider } from './context/CustomerContext';
import { LandingPage } from './pages/LandingPage';

// Existing pages (keep as-is)
import { OrderTypePage } from './pages/OrderTypePage';
import { MenuPage } from './pages/MenuPage';
import { CartPage } from './pages/CartPage';
import { OrderStatusPage } from './pages/OrderStatusPage';
import { ReceiptPage } from './pages/ReceiptPage';

const App: React.FC = () => {
  return (
    <CustomerProvider>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* NEW: Landing page with hero, promos, customer capture */}
          <Route path="/" element={<LandingPage />} />

          {/* Existing routes (unchanged) */}
          <Route path="/order-type" element={<OrderTypePage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/status/:orderId" element={<OrderStatusPage />} />
          <Route path="/receipt/:orderId" element={<ReceiptPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </CustomerProvider>
  );
};

export default App;
