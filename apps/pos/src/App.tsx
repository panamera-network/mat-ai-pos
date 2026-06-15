import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore, RoleGuard } from '@mat-ai/backoffice';
import { MainPage } from './pages/MainPage';
import { Dashboard } from './pages/Dashboard';
import { POSPage } from './pages/POSPage';
import { PaymentPage } from './pages/PaymentPage';
import { ReceiptHistoryPage } from './pages/ReceiptHistoryPage';
import { MenuEditPage } from './pages/MenuEditPage';
import { InventoryPage } from './pages/InventoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { SalesReportPage } from './pages/SalesReportPage';
import { StaffPage } from './pages/StaffPage';
import { PayrollPage } from './pages/PayrollPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};

const App: React.FC = () => {
  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-100">
      <Routes>
        {/* Public */}
        <Route path="/" element={<MainPage />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pos"
          element={
            <ProtectedRoute>
              <POSPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment/:orderId"
          element={
            <ProtectedRoute>
              <PaymentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/receipts"
          element={
            <ProtectedRoute>
              <ReceiptHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Manager+ routes */}
        <Route
          path="/sales"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['MANAGER', 'ADMIN']}>
                <SalesReportPage />
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['MANAGER', 'ADMIN']}>
                <StaffPage />
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['MANAGER', 'ADMIN']}>
                <InventoryPage />
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Admin only routes */}
        <Route
          path="/payroll"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['ADMIN']}>
                <PayrollPage />
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/menu"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['ADMIN']}>
                <MenuEditPage />
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
};

export default App;