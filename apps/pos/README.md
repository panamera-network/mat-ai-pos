# MAT.ai POS App

Cashier-facing POS app for table service, takeaway, delivery, reservations, payments, and kitchen dispatch.

## Run

```bash
pnpm pos:dev
pnpm --filter @mat-ai/pos build
pnpm --filter @mat-ai/pos type-check
```

## Main Screens

- Dashboard: active orders, table floor plan, QR approvals, reservation cards for today.
- POS order page: menu selection, modifiers, cart, order editing, right-panel actions.
- Reservations: all active reservations, date filter, search, table assignment, send to KDS.
- Payments: payment method selection, receipt generation, table release.
- Receipt history: view and reprint receipts.
- Settings: API/server settings and KDS bridge host/port.

## Order Behavior

- New dine-in order marks the table as occupied and sends the order to KDS.
- Selecting a table directly from the floor plan also marks it occupied after save.
- Takeaway and delivery orders remain visible as active order cards.
- Delivery address is shown in the order edit panel.
- Reservations do not require a table when created.
- Reservation `Order Now` can create an active order.
- Reservation `Order @ Counter` stays in reservations until the table is assigned.
- Assigning a table from the Reservation page converts the reservation to dine-in, marks the table occupied, and sends it to KDS.

## Right Panel Actions

Open any order card to enter the POS page. The global three-dot menu in the right panel supports:

- Edit order
- Change order type
- Change table
- Re-send to KDS
- Reprint kitchen order
- Reprint unpaid bill
- Void ticket

## KDS Bridge Settings

The POS app sends kitchen events to the local POS Bridge over HTTP.

Recommended setup:

1. Run the bridge on the POS host machine.
2. Open POS Settings.
3. Set bridge host to the host machine IP or `localhost` when testing on the same device.
4. Set bridge port to `8080`.

The POS app broadcasts to:

```text
http://<bridge-host>:8080/orders/broadcast
```

## Printing

Current printing uses browser print windows for:

- Kitchen order slip
- Unpaid bill
- Paid receipt

Hardware ESC/POS printer integration can be added later behind the same print helpers.

## Environment

The app reads the API URL from Vite env when provided. Local development normally targets:

```text
VITE_API_URL=http://localhost:4000
```
