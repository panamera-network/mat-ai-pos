# MAT.ai API Service

NestJS backend for MAT.ai POS. It owns the database API used by POS, QR Menu, Backoffice, Admin, and related services.

## Run

```bash
pnpm api:dev
pnpm --filter @mat-ai/backend build
```

Default local URL:

```text
http://localhost:4000
```

## Database

The API uses Prisma.

```bash
pnpm --filter @mat-ai/backend db:generate
pnpm --filter @mat-ai/backend db:migrate
pnpm --filter @mat-ai/backend db:seed
```

Useful local reset:

```bash
pnpm --filter @mat-ai/backend db:fresh
```

## Main Domains

- Orders
- Tables
- Menu items and modifiers
- Receipts and payments
- Staff, auth, and roles
- Reservations
- WebSocket gateway events

## Order Notes

- Dine-in orders can assign and occupy a table.
- Paid orders release their table.
- Reservations are stored without requiring a table.
- Reservation assignment happens from the POS Reservation page, then the order can be sent to KDS.

## Troubleshooting

If TypeScript reports missing Prisma model or enum exports, regenerate the Prisma client:

```bash
pnpm --filter @mat-ai/backend db:generate
```
