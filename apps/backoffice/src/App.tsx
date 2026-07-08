//apps/backoffice/src/App.tsx
import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
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
import { CostingCalculatorPage } from './pages/costing/CostingCalculatorPage';
import { MenuItemsWithCostPage } from './pages/costing/MenuItemsWithCostPage';
import { CostingPage } from './pages/costing/CostingPage';
import { RecipeBuilderPage } from './pages/costing/RecipeBuilderPage';
import { CustomersPage } from './pages/CustomersPage';
import { PromotionsPage } from './pages/PromotionsPage';
import { HelpPage } from './pages/HelpPage';
import { LandingPageCMS } from './pages/LandingPageCMS'
import ChartOfAccountsPage from './pages/accounting/ChartOfAccountsPage';
import JournalEntriesPage from './pages/accounting/JournalEntriesPage';
import GeneralLedgerPage from './pages/accounting/GeneralLedgerPage';
import TrialBalancePage from './pages/accounting/TrialBalancePage';
import FinancialReportsPage from './pages/accounting/FinancialReportsPage';



// ============ AUTH GUARD ============
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// ============ LAYOUT WRAPPER ============
// Uses <Outlet /> for nested routes — proper React Router v6 pattern
const AppLayout: React.FC = () => {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected routes with Layout */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard */}
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Sales & Reports */}
        <Route path="/sales" element={<SalesReportPage />} />

        {/* Staff Management */}
        <Route path="/staff" element={<StaffPage />} />
        <Route path="/payroll" element={<PayrollPage />} />

        {/* Menu & Inventory */}
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/inventory" element={<InventoryPage />} />

        {/* Costing Engine */}
        <Route path="/costing" element={<CostingPage />} />
        <Route path="/costing/recipes" element={<MenuItemsWithCostPage />} />
        <Route path="/costing/recipes/:menuItemId" element={<RecipeBuilderPage />} />
        <Route path="/costing/calculator" element={<CostingCalculatorPage />} />

        {/* Customers & Promotions */}
        <Route path="/customers" element={<CustomersPage />} />
        
        {/* QR Menu Management */}
        <Route path="/promotions" element={<PromotionsPage />} />
        <Route path="/landing-page" element={<LandingPageCMS />} />

        {/* Settings */}
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/help" element={<HelpPage />} />

        {/* Outlets — Admin only */}
        <Route
          path="/outlets"
          element={
            <RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
              <OutletManagementPage />
            </RoleGuard>
          }
        />
        {/* Accounting */}
        <Route path= '/accounting/chart-of-accounts' element={<ChartOfAccountsPage />} />
        <Route path= '/accounting/journal-entries' element={<JournalEntriesPage />} />
        <Route path= '/accounting/general-ledger' element={<GeneralLedgerPage />} />
        <Route path= '/accounting/trial-balance' element={<TrialBalancePage />} />
        <Route path= '/accounting/financial-reports' element={<FinancialReportsPage />} />  
        
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
};

export default App;
