# MAT.ai Admin App

Admin dashboard app for system-level management and operational oversight.

## Run

```bash
pnpm admin:dev
pnpm --filter @mat-ai/admin build
pnpm --filter @mat-ai/admin type-check
```

## Scope

The Admin app is separate from the cashier POS flow. Use it for admin-facing dashboards, configuration, and system management screens.

## Related Apps

- POS: live cashier operations.
- Backoffice: business management and reporting.
- API: shared backend for orders, menus, tables, receipts, staff, and auth.
