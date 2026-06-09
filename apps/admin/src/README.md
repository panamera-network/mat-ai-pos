# @mat-ai/admin

Admin Dashboard for MAT.ai POS System.

## Description

Responsive admin app for restaurant managers and owners. Works on iPhone, iPad (landscape), and PC.

- **iPhone**: Bottom tab navigation, card-based lists, touch-optimized
- **iPad/PC**: Sidebar navigation, data tables, grid layouts, full dashboard

## Features

- **Dashboard** — Real-time overview with summary cards and alerts
- **Sales** — Period-based reports (today/week/month) with order tables
- **Staff** — Staff directory, attendance tracking, payroll management
- **Inventory** — Low stock alerts, stock levels, movement logs
- **Settings** — Business configuration, grouped by category

## Tech Stack

- React 18 + Vite + TypeScript
- Tailwind CSS (responsive)
- Zustand (state management)
- Socket.IO (real-time updates)
- PWA ready (installable on iOS)

## Quick Start

```bash
# From project root
pnpm install

# Run admin app only
pnpm --filter @mat-ai/admin dev

# Or add to root package.json:
# "admin:dev": "pnpm --filter @mat-ai/admin dev"

App runs on http://localhost:3002

Responsive Breakpoints

| Breakpoint                   | Layout                                   |
| ---------------------------- | ---------------------------------------- |
| < 768px (iPhone)             | Bottom tabs, stacked cards, full-width   |
| ≥ 768px (iPad portrait)      | Sidebar, 2-3 col grids, compact tables   |
| ≥ 1024px (iPad landscape/PC) | Full sidebar, 3-5 col grids, full tables |


Authentication
Login with staff PIN. Only ADMIN and MANAGER roles can access.

API Endpoints Used

| Endpoint             | Description                                      |
| -------------------- | ------------------------------------------------ |
| GET /orders          | Sales data                                       |
| GET /staff           | Staff directory                                  |
| GET /timecards       | Attendance records                               |
| GET /payrolls        | Payroll records                                  |
| GET /inventory-items | Inventory levels                                 |
| GET /stock-logs      | Stock movements                                  |
| GET /leave-requests  | Leave applications                               |
| POST /auth/login     | PIN authentication (fallback: direct staff list) |

Project Structure
src/
├── pages/
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── SalesPage.tsx
│   ├── StaffPage.tsx
│   ├── InventoryPage.tsx
│   └── SettingsPage.tsx
├── components/
│   ├── Sidebar.tsx         # Desktop/iPad nav
│   ├── BottomNav.tsx       # Mobile nav
│   ├── SummaryCard.tsx
│   └── ProtectedRoute.tsx
├── hooks/
│   ├── useApi.ts
│   ├── useAuth.ts
│   └── useSocket.ts
├── stores/
│   └── authStore.ts
└── App.tsx

Mobile Design

Bottom tab navigation (iPhone optimized)
5 tabs: Dashboard, Sales, Staff, Stock, Settings
Swipeable lists
Pull-to-refresh ready
Touch-friendly buttons (min 44px)
Safe area support for notched devices

Notes

All list views have dual rendering: cards for mobile, tables for desktop
Dashboard auto-refreshes every 30 seconds
Socket.IO connects to admin room for real-time updates
useAuth has fallback PIN validation if /auth/login endpoint not ready

License

MIT

---

## Setup Steps

1. **Create semua file** ikut structure atas dalam `apps/admin/`
2. **Add script** dalam root `package.json`:
   ```json
   "admin:dev": "pnpm --filter @mat-ai/admin dev"