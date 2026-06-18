//apps/backoffice/src/App.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore, RoleGuard } from '@mat-ai/backoffice';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { SalesReportPage } from './pages/SalesReportPage';
import { StaffPage } from './pages/StaffPage';
import { PayrollPage } from './pages/PayrollPage';
import { MenuPage } from './pages/MenuPage';
import { InventoryPage } from './pages/inventory/InventoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { OutletManagementPage } from './pages/OutletManagementPage';
import { CustomerPage } from './pages/CustomerPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/sales" element={<SalesReportPage />} />
                <Route path="/staff" element={<StaffPage />} />
                <Route path="/payroll" element={<PayrollPage />} />
                <Route path="/menu" element={<MenuPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/customers" element={<CustomerPage />} />
                <Route
                  path="/outlets"
                  element={
                    <RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                      <OutletManagementPage />
                    </RoleGuard>
                  }
                />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default App;