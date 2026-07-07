# MAT.ai POS

Smart restaurant POS monorepo for QR ordering, POS operations, kitchen display, back office, and the local POS-to-KDS bridge.

## Stack

- Node.js 20+
- pnpm 11.x
- Turborepo
- React + Vite for web apps
- NestJS + Prisma for the API
- WebSocket bridge for local POS to KDS communication

## Workspace

```text
apps/
  pos/          Cashier POS, table plan, payments, reservations, receipts
  kitchen/      KDS screen for kitchen terminals
  qr-menu/      Customer QR ordering app
  backoffice/   Management and reporting app
  admin/        Admin dashboard app

services/
  api/          NestJS API and Prisma database service
  pos-bridge/   Local WebSocket bridge used by POS and KDS

packages/
  backoffice/   Shared backoffice navigation and domain config
  ui/           Shared UI primitives
  ws/           Shared WebSocket client helpers
  types/        Shared TypeScript types
```

## Install

```bash
pnpm install
pnpm --filter @mat-ai/backend db:generate
```

The repo is pinned to `pnpm@11.7.0` in `packageManager`.

## Run Everything

```bash
pnpm start
```

This runs the Turbo dev graph, including frontend apps, API dev server, and the POS bridge when their workspace scripts are available.

## Run Individually

```bash
pnpm api:dev
pnpm pos:dev
pnpm kitchen:dev
pnpm qr:dev
pnpm backoffice:dev
pnpm admin:dev
pnpm bridge:dev
```

Default local ports:

| Service | Default |
| --- | --- |
| API | `http://localhost:4000` |
| POS Bridge | `http://localhost:8080` and `ws://localhost:8080` |
| KDS | `http://localhost:3001` |
| Backoffice | `http://localhost:3004` |

Other Vite apps use their configured/default Vite port unless overridden locally.

## Current Order Flow

```text
QR Menu -> API / Cloud -> POS dashboard -> POS approve -> POS Bridge -> KDS
POS manual order -> POS Bridge -> KDS
POS payment -> API -> table released
Reservation -> POS reservation list -> assign table -> POS Bridge -> KDS
```

Important behavior:

- Dine-in orders occupy the selected table.
- Takeaway and delivery stay as active order cards after approval.
- Reservations do not need a table at creation time.
- Reservations are not sent to KDS until a table is assigned from the Reservation page.
- Dashboard active table view shows today's reservation cards; the Reservation page can show all reservations.
- KDS connects to the local POS Bridge IP and port, not directly to the browser POS app.

## Local KDS Bridge

The POS browser cannot safely run a WebSocket server or raw TCP printer connection by itself, so the bridge is a small Node service.

```bash
pnpm bridge:dev
```

Bridge endpoints:

- `GET /health`
- `POST /orders/broadcast`
- `POST /print`
- `ws://<pos-device-ip>:8080`

For real devices, set KDS to the POS/host machine LAN IP, for example `ws://192.168.100.122:8080`.

## Printing

POS supports two print modes from POS Settings:

- Browser print: default mode, opens the browser print dialog.
- ESC/POS network printer: POS sends print jobs to the POS Bridge, and the bridge prints to the configured printer IP/port, usually port `9100`.

The print helpers are shared by payment receipt printing, receipt history reprint, unpaid bill print, and kitchen order reprint.

## Useful Checks

```bash
pnpm --filter @mat-ai/pos type-check
pnpm --filter @mat-ai/pos build
pnpm --filter @mat-ai/qr-menu type-check
pnpm --filter @mat-ai/qr-menu build
pnpm --filter @mat-ai/kitchen build
pnpm --filter @mat-ai/backend build
```

If backend build reports missing Prisma exports, regenerate the Prisma client first:

```bash
pnpm --filter @mat-ai/backend db:generate
```

## App READMEs

- [POS](apps/pos/README.md)
- [Kitchen Display](apps/kitchen/README.md)
- [QR Menu](apps/qr-menu/README.md)
- [Backoffice](apps/backoffice/README.md)
- [Admin](apps/admin/README.md)
- [API](services/api/README.md)
- [POS Bridge](services/pos-bridge/README.md)
