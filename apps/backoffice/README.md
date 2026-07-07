# MAT.ai Backoffice App

Management app for operators, managers, and admins.

## Run

```bash
pnpm backoffice:dev
pnpm --filter @mat-ai/backoffice-app build
```

Default dev URL:

```text
http://localhost:3004
```

## Scope

Backoffice is for business management work such as:

- Dashboard and reporting
- Staff and role access
- Menu and item setup
- Inventory and costing
- Sales and payment review
- Accounting and operational views
- Reservation navigation entry point

The app consumes shared navigation and domain configuration from `packages/backoffice`.

## Access Notes

Super admin style users bypass role filtering in the shared navigation config. Regular users see menu items based on role permissions.

## Relationship With POS

POS handles live restaurant operations. Backoffice is for setup, review, and management workflows.
