# MAT.ai Kitchen Display

Kitchen Display System (KDS) app for kitchen terminals. It receives orders from the POS Bridge over WebSocket.

## Run

```bash
pnpm kitchen:dev
pnpm --filter @mat-ai/kitchen build
```

Default dev URL:

```text
http://localhost:3001
```

## Connection Model

The KDS connects to the POS Bridge, not directly to the POS browser tab.

Same machine:

```text
ws://localhost:8080
```

Separate Android tablet or kitchen terminal:

```text
ws://<pos-host-lan-ip>:8080
```

Example:

```text
ws://192.168.100.122:8080
```

## Expected Flow

```text
POS or QR-approved order -> POS Bridge -> KDS
```

Orders appear in KDS after:

- POS manual dine-in, takeaway, or delivery order is saved.
- QR dine-in, takeaway, or delivery order is approved in POS.
- Reservation is assigned to a table from the POS Reservation page.

Reservations are intentionally not sent to KDS until table assignment.

## Settings

Use the KDS Settings screen to configure:

- Bridge host
- Bridge port
- Kitchen station identity

If KDS runs on another device, use the LAN IP of the machine running `pnpm bridge:dev`.

## Troubleshooting

- A WebSocket `error` warning normally means the bridge is unreachable or still starting.
- If KDS is on Android/iPad, do not use `localhost` unless the bridge is running on that same device.
- Check the bridge health endpoint from the KDS device network:

```text
http://<pos-host-lan-ip>:8080/health
```
