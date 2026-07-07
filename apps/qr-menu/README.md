# MAT.ai QR Menu

Customer-facing QR ordering app for dine-in, takeaway, delivery, and reservations.

## Run

```bash
pnpm qr:dev
pnpm --filter @mat-ai/qr-menu build
pnpm --filter @mat-ai/qr-menu type-check
```

## Flow

```text
Customer QR order -> API / Cloud -> POS dashboard -> cashier approve -> KDS
```

Behavior by order type:

- Dine-in: customer selects table; POS approval marks the table occupied and sends to KDS.
- Takeaway: POS approval creates an active order card and sends to KDS.
- Delivery: POS approval keeps the delivery address and sends to KDS.
- Reservation: POS approval creates/keeps the reservation record and does not send to KDS until table assignment.

## Menu Modifiers

The QR menu supports item options and modifiers from menu data. Modifier values can come from:

- String lists
- Choice arrays
- Object maps

Selected modifiers are passed into the order payload so POS and KDS can show the selected options.

## API

Local development normally targets:

```text
http://localhost:4000
```

Use Vite env config when pointing the QR app at another API host.
